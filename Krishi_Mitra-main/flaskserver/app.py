from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import os
import sys
import joblib
from datetime import datetime, timedelta
import traceback

# MongoDB imports
from config.database import init_database
from services.database_service import (
    FieldMapService, 
    CropLifecycleService, 
    YieldPredictionService, 
    UserSessionService,
    get_user_session_id
)

app = Flask(__name__)
CORS(app)

# Initialize database
print("Initializing MongoDB connection...")
mongodb_connected = init_database()

# Initialize services (only if MongoDB is connected)
field_service = None
crop_service = None
yield_service = None 
session_service = None

if mongodb_connected:
    try:
        field_service = FieldMapService()
        crop_service = CropLifecycleService()
        yield_service = YieldPredictionService()
        session_service = UserSessionService()
        print("✅ MongoDB services initialized")
    except Exception as e:
        print(f"❌ Failed to initialize MongoDB services: {e}")
        mongodb_connected = False

# ML Model Functions
def load_models(models_dir='../models/trained_models'):
    try:
        if not os.path.exists(models_dir):
            print(f"ERROR: Models directory not found at {models_dir}")
            return None, None, None
            
        duration_files = [f for f in os.listdir(models_dir) if f.startswith('duration_')]
        stages = [f.split('_')[1] for f in duration_files]
        
        # Load duration models
        duration_models = {}
        for stage in stages:
            model_path = f"{models_dir}/duration_{stage}_model.pkl"
            duration_models[stage] = joblib.load(model_path)
        
        # Load irrigation models
        irrigation_models = {}
        for stage in stages:
            model_path = f"{models_dir}/irrigation_{stage}_model.pkl"
            irrigation_models[stage] = joblib.load(model_path)
        
        # Load feature columns
        feature_path = f"{models_dir}/feature_columns.pkl"
        feature_columns = joblib.load(feature_path)
        
        return duration_models, irrigation_models, feature_columns
    
    except Exception as e:
        print(f"Error loading models: {e}")
        traceback.print_exc()
        return None, None, None

def predict_crop_timeline_and_irrigation(crop_type, sow_date_str, weather_data, soil_data, 
                                         all_feature_cols, duration_models, irrigation_models):
    
    stages = list(duration_models.keys())
    sow_date = datetime.strptime(sow_date_str, '%Y-%m-%d')
    
    # Create the base input dictionary
    input_data = {
        'Year': sow_date.year,
        'Sow_Month': sow_date.month,
        'Temp_C': weather_data['temperature'],
        'Rainfall_mm': weather_data['rainfall'],
        'Humidity_%': weather_data['humidity'],
        'SoilMoist_%': soil_data['moisture']
    }
    
    new_input_df = pd.DataFrame([input_data])
    for col in all_feature_cols:
        if col not in new_input_df.columns:
             new_input_df[col] = 0
             
    # Set the specific crop column to 1
    crop_col_name = f'Crop_{crop_type}'
    if crop_col_name not in all_feature_cols:
        available_crops = [col.split('_')[1] for col in all_feature_cols if col.startswith('Crop_')]
        raise ValueError(f"Crop type '{crop_type}' not found. Available crops: {available_crops}")
        
    new_input_df[crop_col_name] = 1
    new_input_df = new_input_df[all_feature_cols]

    pred_durs = {
        stage: max(1, int(duration_models[stage].predict(new_input_df)[0])) 
        for stage in stages
    }
    
    pred_irrigation = {
        stage: max(0.1, float(irrigation_models[stage].predict(new_input_df)[0]))
        for stage in stages
    }

    # Timeline
    timeline = []
    current = sow_date
    for stage in stages:
        dur = pred_durs[stage]
        end = current + timedelta(days=dur)
        timeline.append({
            'Stage': stage,
            'Duration_Days': dur,
            'Start': current.strftime('%Y-%m-%d'),
            'End': end.strftime('%Y-%m-%d'),
            'Irrigation_Need': f"{pred_irrigation[stage]:.2f} lphw"
        })
        current = end

    total_days = sum(pred_durs.values())
    harvest_date = sow_date + timedelta(days=total_days)
    
    # Create irrigation schedule
    irrigation_schedule = []
    current = sow_date
    for stage in stages:
        stage_duration = pred_durs[stage]
        stage_end = current + timedelta(days=stage_duration)
        stage_irrigation = pred_irrigation[stage]
        
        week_start = current
        while week_start < stage_end:
            week_end = min(week_start + timedelta(days=7), stage_end)
            days_in_week = (week_end - week_start).days
            
            weekly_irrigation = stage_irrigation * min(7, days_in_week) / 7
            
            irrigation_schedule.append({
                'Week_Start': week_start.strftime('%Y-%m-%d'),
                'Week_End': week_end.strftime('%Y-%m-%d'),
                'Stage': stage,
                'Irrigation_Need': f"{weekly_irrigation:.2f} lphw"
            })
            
            week_start = week_end

    return {
        'crop': crop_type,
        'sow_date': sow_date.strftime('%Y-%m-%d'),
        'harvest_date': harvest_date.strftime('%Y-%m-%d'),
        'total_duration': total_days,
        'timeline': timeline,
        'irrigation_schedule': irrigation_schedule
    }

def generate_weather_data(sow_date_str):
    """Generate realistic weather data based on sowing date and season"""
    sow_date = datetime.strptime(sow_date_str, '%Y-%m-%d')
    month = sow_date.month
    
    # Seasonal weather patterns
    if month in [12, 1, 2]:  # Winter
        temp_base = 20
        rainfall_base = 50
        humidity_base = 60
    elif month in [3, 4, 5]:  # Spring
        temp_base = 25
        rainfall_base = 80
        humidity_base = 65
    elif month in [6, 7, 8]:  # Summer
        temp_base = 32
        rainfall_base = 120
        humidity_base = 75
    else:  # Autumn [9, 10, 11]
        temp_base = 28
        rainfall_base = 70
        humidity_base = 70
    
    # Add some randomness
    return {
        'temperature': temp_base + np.random.uniform(-3, 3),
        'rainfall': max(10, rainfall_base + np.random.uniform(-30, 50)),
        'humidity': max(40, min(90, humidity_base + np.random.uniform(-10, 15)))
    }

def generate_soil_data():
    """Generate realistic soil data"""
    return {
        'moisture': np.random.uniform(20, 35),  # Soil moisture percentage
        'nitrogen': np.random.uniform(0.8, 1.5),  # N content
        'phosphorus': np.random.uniform(15, 35),   # P content
        'potassium': np.random.uniform(150, 300),  # K content
        'ph': np.random.uniform(6.0, 7.5)         # pH value
    }

# Load models at startup
print("Loading ML models...")
DURATION_MODELS, IRRIGATION_MODELS, FEATURE_COLUMNS = load_models()

if DURATION_MODELS is None:
    print("WARNING: Could not load ML models. Crop prediction will not work properly.")

# Example static data for demo; replace with real model calls
crop_data_example = {
    "growth_stages": [
        {"stage": "Initial Stage", "duration_days": 15, "Kc": 0.4},
        {"stage": "Development Stage", "duration_days": 25, "Kc": "0.4-1.15"},
        {"stage": "Mid-season Stage", "duration_days": 40, "Kc": 1.15},
        {"stage": "Late-season Stage", "duration_days": 30, "Kc": 0.4},
    ],
    "irrigation_schedule": [
        {"date": "2025-12-13", "amount_mm": 25.0, "note": "Automatic irrigation based on soil water deficit"},
        {"date": "2025-12-18", "amount_mm": 25.0, "note": "Automatic irrigation based on soil water deficit"}
    ],
    "irrigation_total_mm": 400.0,
    "fertilizer_schedule": [
        {"date": "2025-11-15", "nutrient": "N", "amount_kg_per_ha": 60, "application": "basal"},
        {"date": "2025-11-15", "nutrient": "P", "amount_kg_per_ha": 60, "application": "basal"},
        {"date": "2025-12-05", "nutrient": "N", "amount_kg_per_ha": 40, "application": "top_dress"},
    ],
    "fertilizer_totals": {"N": 140, "P": 60, "K": 40},
    "water_balance_summary": {
        "total_precipitation_mm": 194.0,
        "total_irrigation_mm": 400.0,
        "total_ET_mm": 608.2
    }
}

@app.route('/')
def home():
    return jsonify({"message": "Crop Prediction API is running!"})

@app.route('/api/status')
def api_status():
    """Get API status including MongoDB connection"""
    return jsonify({
        "status": "running",
        "mongodb_connected": mongodb_connected,
        "ml_models_loaded": DURATION_MODELS is not None,
        "services_available": {
            "field_mapping": field_service is not None,
            "crop_lifecycle": crop_service is not None,
            "yield_prediction": yield_service is not None,
            "user_sessions": session_service is not None
        }
    })

@app.route('/predict-crop-cycle', methods=['POST'])
def predict_crop_cycle():
    """
    Predicts crop lifecycle based on crop type and sowing date.
    Automatically generates weather and soil data.
    """
    try:
        data = request.json
        crop_type = data.get('crop_type')
        sowing_date = data.get('sowing_date')

        if not crop_type or not sowing_date:
            return jsonify({'error': 'Please provide crop_type and sowing_date'}), 400

        # Check if models are loaded
        if DURATION_MODELS is None or IRRIGATION_MODELS is None or FEATURE_COLUMNS is None:
            return jsonify({'error': 'ML models not available. Please check server logs.'}), 500

        # Generate weather and soil data
        weather_data = generate_weather_data(sowing_date)
        soil_data = generate_soil_data()

        # Make prediction
        result = predict_crop_timeline_and_irrigation(
            crop_type=crop_type,
            sow_date_str=sowing_date,
            weather_data=weather_data,
            soil_data=soil_data,
            all_feature_cols=FEATURE_COLUMNS,
            duration_models=DURATION_MODELS,
            irrigation_models=IRRIGATION_MODELS
        )

        # Add generated data to response
        result['generated_data'] = {
            'weather': weather_data,
            'soil': soil_data
        }

        return jsonify(result)

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"Error in crop prediction: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error occurred'}), 500

@app.route('/crop-info', methods=['POST'])
def crop_info():
    """
    Accepts JSON input with crop type and planting date,
    runs prediction (placeholder),
    returns crop growth stages, irrigation, fertilizer, and water balance info.
    """
    data = request.json
    crop_type = data.get('crop_type')
    planting_date = data.get('planting_date')

    if not crop_type or not planting_date:
        return jsonify({'error': 'Please provide crop_type and planting_date'}), 400

    # TODO: Replace with real model inference based on input parameters
    # For now, return static example data
    return jsonify(crop_data_example)


@app.route('/growth-stages', methods=['GET'])
def get_growth_stages():
    return jsonify(crop_data_example["growth_stages"])

@app.route('/irrigation-schedule', methods=['GET'])
def get_irrigation_schedule():
    return jsonify({
        "schedule": crop_data_example["irrigation_schedule"],
        "total_irrigation_mm": crop_data_example["irrigation_total_mm"]
    })

@app.route('/fertilizer-schedule', methods=['GET'])
def get_fertilizer_schedule():
    return jsonify({
        "schedule": crop_data_example["fertilizer_schedule"],
        "totals": crop_data_example["fertilizer_totals"]
    })

@app.route('/water-balance-summary', methods=['GET'])
def get_water_balance_summary():
    return jsonify(crop_data_example["water_balance_summary"])

# ============ NEW MONGODB ENDPOINTS ============

def check_mongodb_available():
    """Check if MongoDB services are available"""
    if not mongodb_connected or not field_service:
        return jsonify({
            'error': 'MongoDB is not available. Please check connection and try again.',
            'mongodb_status': 'disconnected'
        }), 503
    return None

# Field Mapping Endpoints
@app.route('/api/fields', methods=['POST'])
def create_field_map():
    """Create a new field map"""
    # Check MongoDB availability
    mongo_check = check_mongodb_available()
    if mongo_check:
        return mongo_check
        
    try:
        user_id = get_user_session_id(request)
        field_data = request.json
        
        # Validate required fields
        required_fields = ['field_name', 'coordinates', 'area']
        for field in required_fields:
            if not field_data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        field_map = field_service.create_field_map(user_id, field_data)
        session_service.update_session_stats(user_id, 'fields')
        
        return jsonify({
            'success': True,
            'message': 'Field map created successfully',
            'data': field_map
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/fields', methods=['GET'])
def get_user_fields():
    """Get all field maps for current user"""
    try:
        user_id = get_user_session_id(request)
        fields = field_service.get_field_maps_by_user(user_id)
        
        return jsonify({
            'success': True,
            'data': fields
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/fields/<field_id>', methods=['GET'])
def get_field_map(field_id):
    """Get a specific field map"""
    try:
        field = field_service.get_field_map_by_id(field_id)
        
        if not field:
            return jsonify({'error': 'Field not found'}), 404
            
        return jsonify({
            'success': True,
            'data': field
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/fields/<field_id>', methods=['PUT'])
def update_field_map(field_id):
    """Update a field map"""
    try:
        update_data = request.json
        field = field_service.update_field_map(field_id, update_data)
        
        return jsonify({
            'success': True,
            'message': 'Field map updated successfully',
            'data': field
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/fields/<field_id>', methods=['DELETE'])
def delete_field_map(field_id):
    """Delete a field map"""
    try:
        success = field_service.delete_field_map(field_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Field map deleted successfully'
            })
        else:
            return jsonify({'error': 'Field not found or could not be deleted'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Crop Lifecycle Endpoints
@app.route('/api/crops', methods=['POST'])
def create_crop_lifecycle():
    """Create a new crop lifecycle"""
    try:
        user_id = get_user_session_id(request)
        lifecycle_data = request.json
        
        # Validate required fields
        required_fields = ['field_id', 'crop_name', 'sowing_date']
        for field in required_fields:
            if not lifecycle_data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # If we have the ML models, use them to generate predictions
        if DURATION_MODELS and IRRIGATION_MODELS and FEATURE_COLUMNS:
            try:
                # Generate weather and soil data if not provided
                weather_data = {
                    'temperature': lifecycle_data.get('temperature') or generate_weather_data(lifecycle_data['sowing_date'])['temperature'],
                    'rainfall': lifecycle_data.get('rainfall') or generate_weather_data(lifecycle_data['sowing_date'])['rainfall'],
                    'humidity': lifecycle_data.get('humidity') or generate_weather_data(lifecycle_data['sowing_date'])['humidity']
                }
                
                soil_data = {
                    'moisture': lifecycle_data.get('soil_moisture') or generate_soil_data()['moisture']
                }
                
                # Make ML prediction
                ml_prediction = predict_crop_timeline_and_irrigation(
                    crop_type=lifecycle_data['crop_name'],
                    sow_date_str=lifecycle_data['sowing_date'],
                    weather_data=weather_data,
                    soil_data=soil_data,
                    all_feature_cols=FEATURE_COLUMNS,
                    duration_models=DURATION_MODELS,
                    irrigation_models=IRRIGATION_MODELS
                )
                
                # Add ML predictions to lifecycle data
                lifecycle_data['growth_stages'] = ml_prediction.get('timeline', [])
                lifecycle_data['irrigation_schedule'] = ml_prediction.get('irrigation_schedule', [])
                lifecycle_data['expected_harvest_date'] = ml_prediction.get('harvest_date')
                lifecycle_data['total_irrigation'] = sum(
                    float(stage.get('Irrigation_Need', '0').replace(' lphw', ''))
                    for stage in ml_prediction.get('timeline', [])
                )
                
            except Exception as ml_error:
                print(f"ML prediction failed: {ml_error}")
                # Continue without ML predictions
        
        crop_lifecycle = crop_service.create_crop_lifecycle(user_id, lifecycle_data)
        session_service.update_session_stats(user_id, 'crops')
        
        return jsonify({
            'success': True,
            'message': 'Crop lifecycle created successfully',
            'data': crop_lifecycle
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/crops', methods=['GET'])
def get_user_crops():
    """Get all crop lifecycles for current user"""
    try:
        user_id = get_user_session_id(request)
        crops = crop_service.get_crop_lifecycles_by_user(user_id)
        
        return jsonify({
            'success': True,
            'data': crops
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/crops/<crop_id>', methods=['GET'])
def get_crop_lifecycle(crop_id):
    """Get a specific crop lifecycle"""
    try:
        crop = crop_service.get_crop_lifecycle_by_id(crop_id)
        
        if not crop:
            return jsonify({'error': 'Crop lifecycle not found'}), 404
            
        return jsonify({
            'success': True,
            'data': crop
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/crops/field/<field_id>', methods=['GET'])
def get_field_crops(field_id):
    """Get all crop lifecycles for a specific field"""
    try:
        crops = crop_service.get_crop_lifecycles_by_field(field_id)
        
        return jsonify({
            'success': True,
            'data': crops
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/crops/<crop_id>/stage', methods=['POST'])
def update_crop_stage(crop_id):
    """Update current crop growth stage"""
    try:
        stage_data = request.json
        
        if not stage_data.get('stage_name'):
            return jsonify({'error': 'Missing stage_name'}), 400
        
        success = crop_service.update_crop_stage(crop_id, **stage_data)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Crop stage updated successfully'
            })
        else:
            return jsonify({'error': 'Could not update crop stage'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/crops/<crop_id>/irrigation', methods=['POST'])
def add_irrigation_record(crop_id):
    """Add irrigation record to crop lifecycle"""
    try:
        irrigation_data = request.json
        
        required_fields = ['date', 'amount']
        for field in required_fields:
            if field not in irrigation_data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        success = crop_service.add_irrigation_record(crop_id, irrigation_data)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Irrigation record added successfully'
            })
        else:
            return jsonify({'error': 'Could not add irrigation record'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/crops/<crop_id>/fertilizer', methods=['POST'])
def add_fertilizer_record(crop_id):
    """Add fertilizer application record to crop lifecycle"""
    try:
        fertilizer_data = request.json
        
        required_fields = ['date', 'nutrient_type', 'amount', 'application_method']
        for field in required_fields:
            if field not in fertilizer_data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        success = crop_service.add_fertilizer_record(crop_id, fertilizer_data)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Fertilizer record added successfully'
            })
        else:
            return jsonify({'error': 'Could not add fertilizer record'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Yield Prediction Endpoints
@app.route('/api/yield-predictions', methods=['POST'])
def create_yield_prediction():
    """Create a new yield prediction"""
    try:
        user_id = get_user_session_id(request)
        prediction_data = request.json
        
        # Validate required fields
        required_fields = ['field_id', 'crop_lifecycle_id', 'crop_name']
        for field in required_fields:
            if not prediction_data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Here you would typically run your ML model for yield prediction
        # For now, we'll generate some realistic predictions based on input parameters
        
        # Calculate expected yield based on parameters (simplified logic)
        base_yield = {
            'rice': 5.5,
            'wheat': 4.8,
            'corn': 9.2,
            'maize': 9.2,
            'sugarcane': 75.0,
            'cotton': 2.8,
            'soybean': 3.2
        }
        
        crop_name = prediction_data.get('crop_name', '').lower()
        field_area = prediction_data.get('field_area', 1.0)
        
        # Get base yield for crop type
        expected_yield_per_ha = base_yield.get(crop_name, 4.0)
        
        # Apply modifiers based on soil parameters
        nitrogen = prediction_data.get('nitrogen', 25)
        phosphorus = prediction_data.get('phosphorus', 15)
        potassium = prediction_data.get('potassium', 20)
        ph = prediction_data.get('ph', 6.5)
        
        # Simple yield modification based on soil parameters
        yield_modifier = 1.0
        
        # Nitrogen effect (optimal around 30)
        if 25 <= nitrogen <= 35:
            yield_modifier *= 1.1
        elif nitrogen < 15 or nitrogen > 45:
            yield_modifier *= 0.9
        
        # pH effect (optimal 6.0-7.5)
        if 6.0 <= ph <= 7.5:
            yield_modifier *= 1.05
        elif ph < 5.5 or ph > 8.0:
            yield_modifier *= 0.85
        
        final_yield_per_ha = expected_yield_per_ha * yield_modifier
        total_yield = final_yield_per_ha * field_area
        
        # Add calculated predictions to data
        prediction_data.update({
            'expected_yield': round(final_yield_per_ha, 2),
            'total_yield': round(total_yield, 2),
            'confidence_score': round(min(95, max(70, 85 + (yield_modifier - 1) * 100)), 1),
            'quality_grade': 'A' if yield_modifier > 1.05 else 'B' if yield_modifier > 0.95 else 'C',
            'risk_factors': [],
            'recommendations': []
        })
        
        # Add risk factors based on parameters
        if nitrogen < 20:
            prediction_data['risk_factors'].append('Low nitrogen levels may reduce yield')
            prediction_data['recommendations'].append('Consider nitrogen fertilizer application')
        
        if ph < 6.0:
            prediction_data['risk_factors'].append('Acidic soil may affect nutrient uptake')
            prediction_data['recommendations'].append('Consider lime application to increase pH')
        elif ph > 8.0:
            prediction_data['risk_factors'].append('Alkaline soil may limit nutrient availability')
            prediction_data['recommendations'].append('Consider sulfur application to decrease pH')
        
        if prediction_data.get('irrigation_total', 0) < 200:
            prediction_data['risk_factors'].append('Insufficient irrigation may impact yield')
            prediction_data['recommendations'].append('Ensure adequate water supply during critical growth stages')
        
        yield_prediction = yield_service.create_yield_prediction(user_id, prediction_data)
        session_service.update_session_stats(user_id, 'predictions')
        
        return jsonify({
            'success': True,
            'message': 'Yield prediction created successfully',
            'data': yield_prediction
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/yield-predictions', methods=['GET'])
def get_user_yield_predictions():
    """Get all yield predictions for current user"""
    try:
        user_id = get_user_session_id(request)
        predictions = yield_service.get_yield_predictions_by_user(user_id)
        
        return jsonify({
            'success': True,
            'data': predictions
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/yield-predictions/<prediction_id>', methods=['GET'])
def get_yield_prediction(prediction_id):
    """Get a specific yield prediction"""
    try:
        prediction = yield_service.get_yield_prediction_by_id(prediction_id)
        
        if not prediction:
            return jsonify({'error': 'Yield prediction not found'}), 404
            
        return jsonify({
            'success': True,
            'data': prediction
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/yield-predictions/<prediction_id>/actual', methods=['POST'])
def update_actual_yield(prediction_id):
    """Update prediction with actual harvest results"""
    try:
        actual_data = request.json
        
        required_fields = ['actual_yield', 'actual_harvest_date', 'quality_achieved']
        for field in required_fields:
            if field not in actual_data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        success = yield_service.update_actual_results(
            prediction_id,
            actual_data['actual_yield'],
            actual_data['actual_harvest_date'],
            actual_data['quality_achieved']
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Actual results updated successfully'
            })
        else:
            return jsonify({'error': 'Could not update actual results'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# User Session Endpoint
@app.route('/api/session', methods=['GET'])
def get_user_session():
    """Get current user session information"""
    try:
        user_id = get_user_session_id(request)
        ip_address = request.remote_addr or 'unknown'
        
        session = session_service.create_or_get_session(ip_address)
        
        return jsonify({
            'success': True,
            'data': session
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=False, port=5002)
