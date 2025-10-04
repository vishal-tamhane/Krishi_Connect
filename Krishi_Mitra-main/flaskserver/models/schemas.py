from datetime import datetime
try:
    from bson import ObjectId
except ImportError:
    # Fallback if there's a conflicting bson package
    from pymongo.objectid import ObjectId

# Schema definitions for MongoDB collections

class FieldMapSchema:
    """Schema for field mapping data"""
    
    @staticmethod
    def create_field_map(user_id, field_name, coordinates, area, soil_type, **kwargs):
        """Create a new field map document"""
        return {
            "user_id": user_id,  # Can be IP address or session ID since no auth
            "field_name": field_name,
            "coordinates": coordinates,  # Array of lat/lng objects
            "area": area,  # Area in hectares/acres
            "soil_type": soil_type,
            "elevation": kwargs.get('elevation'),
            "slope": kwargs.get('slope'),
            "drainage": kwargs.get('drainage'),
            "soil_parameters": {
                "nitrogen": kwargs.get('nitrogen'),
                "phosphorus": kwargs.get('phosphorus'),
                "potassium": kwargs.get('potassium'),
                "ph": kwargs.get('ph'),
                "organic_matter": kwargs.get('organic_matter'),
                "moisture": kwargs.get('moisture')
            },
            "weather_data": {
                "average_temperature": kwargs.get('avg_temperature'),
                "annual_rainfall": kwargs.get('annual_rainfall'),
                "humidity": kwargs.get('humidity')
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "status": "active"
        }
    
    @staticmethod
    def update_field_map(existing_doc, **kwargs):
        """Update an existing field map document"""
        update_data = {"updated_at": datetime.utcnow()}
        
        if 'field_name' in kwargs:
            update_data['field_name'] = kwargs['field_name']
        if 'coordinates' in kwargs:
            update_data['coordinates'] = kwargs['coordinates']
        if 'area' in kwargs:
            update_data['area'] = kwargs['area']
        if 'soil_type' in kwargs:
            update_data['soil_type'] = kwargs['soil_type']
            
        # Update soil parameters
        soil_params = {}
        for param in ['nitrogen', 'phosphorus', 'potassium', 'ph', 'organic_matter', 'moisture']:
            if param in kwargs:
                soil_params[param] = kwargs[param]
        if soil_params:
            update_data['soil_parameters'] = {**existing_doc.get('soil_parameters', {}), **soil_params}
        
        # Update weather data
        weather_params = {}
        for param in ['avg_temperature', 'annual_rainfall', 'humidity']:
            if param in kwargs:
                weather_params[param.replace('avg_', 'average_')] = kwargs[param]
        if weather_params:
            update_data['weather_data'] = {**existing_doc.get('weather_data', {}), **weather_params}
        
        return update_data

class CropLifecycleSchema:
    """Schema for crop lifecycle data"""
    
    @staticmethod
    def create_crop_lifecycle(user_id, field_id, crop_name, sowing_date, **kwargs):
        """Create a new crop lifecycle document"""
        return {
            "user_id": user_id,
            "field_id": ObjectId(field_id) if isinstance(field_id, str) else field_id,
            "crop_name": crop_name,
            "crop_variety": kwargs.get('crop_variety'),
            "sowing_date": sowing_date if isinstance(sowing_date, datetime) else datetime.fromisoformat(sowing_date.replace('Z', '+00:00')),
            "expected_harvest_date": kwargs.get('expected_harvest_date'),
            "actual_harvest_date": kwargs.get('actual_harvest_date'),
            
            # Soil and environmental parameters at sowing
            "sowing_parameters": {
                "nitrogen": kwargs.get('nitrogen'),
                "phosphorus": kwargs.get('phosphorus'),
                "potassium": kwargs.get('potassium'),
                "ph": kwargs.get('ph'),
                "temperature": kwargs.get('temperature'),
                "humidity": kwargs.get('humidity'),
                "rainfall": kwargs.get('rainfall'),
                "soil_moisture": kwargs.get('soil_moisture')
            },
            
            # Growth stages timeline
            "growth_stages": kwargs.get('growth_stages', []),
            
            # Irrigation schedule and history
            "irrigation": {
                "schedule": kwargs.get('irrigation_schedule', []),
                "total_water_used": kwargs.get('total_irrigation', 0),
                "irrigation_method": kwargs.get('irrigation_method', 'manual')
            },
            
            # Fertilizer application history
            "fertilizer": {
                "schedule": kwargs.get('fertilizer_schedule', []),
                "total_nitrogen": kwargs.get('total_nitrogen', 0),
                "total_phosphorus": kwargs.get('total_phosphorus', 0),
                "total_potassium": kwargs.get('total_potassium', 0)
            },
            
            # Weather tracking during crop cycle
            "weather_history": kwargs.get('weather_history', []),
            
            # Crop health and observations
            "observations": kwargs.get('observations', []),
            "diseases": kwargs.get('diseases', []),
            "pests": kwargs.get('pests', []),
            
            # Status tracking
            "current_stage": kwargs.get('current_stage', 'seeded'),
            "status": kwargs.get('status', 'active'),  # active, completed, failed
            
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    
    @staticmethod
    def add_growth_stage_update(stage_name, start_date, end_date=None, **kwargs):
        """Create a growth stage update"""
        return {
            "stage_name": stage_name,
            "start_date": start_date if isinstance(start_date, datetime) else datetime.fromisoformat(start_date),
            "end_date": end_date if end_date is None or isinstance(end_date, datetime) else datetime.fromisoformat(end_date),
            "duration_days": kwargs.get('duration_days'),
            "kc_value": kwargs.get('kc_value'),  # Crop coefficient
            "notes": kwargs.get('notes'),
            "updated_at": datetime.utcnow()
        }
    
    @staticmethod
    def add_irrigation_record(date, amount, method='manual', **kwargs):
        """Create an irrigation record"""
        return {
            "date": date if isinstance(date, datetime) else datetime.fromisoformat(date),
            "amount_mm": amount,
            "method": method,
            "notes": kwargs.get('notes'),
            "recorded_at": datetime.utcnow()
        }
    
    @staticmethod
    def add_fertilizer_record(date, nutrient_type, amount, application_method, **kwargs):
        """Create a fertilizer application record"""
        return {
            "date": date if isinstance(date, datetime) else datetime.fromisoformat(date),
            "nutrient_type": nutrient_type,  # N, P, K, or compound
            "amount_kg_per_ha": amount,
            "application_method": application_method,  # basal, top_dress, foliar
            "fertilizer_name": kwargs.get('fertilizer_name'),
            "notes": kwargs.get('notes'),
            "recorded_at": datetime.utcnow()
        }

class YieldPredictionSchema:
    """Schema for yield prediction data"""
    
    @staticmethod
    def create_yield_prediction(user_id, field_id, crop_lifecycle_id, **kwargs):
        """Create a new yield prediction document"""
        return {
            "user_id": user_id,
            "field_id": ObjectId(field_id) if isinstance(field_id, str) else field_id,
            "crop_lifecycle_id": ObjectId(crop_lifecycle_id) if isinstance(crop_lifecycle_id, str) else crop_lifecycle_id,
            
            # Input parameters for prediction
            "prediction_parameters": {
                "crop_name": kwargs.get('crop_name'),
                "field_area": kwargs.get('field_area'),
                "sowing_date": kwargs.get('sowing_date'),
                "current_stage": kwargs.get('current_stage'),
                "days_after_sowing": kwargs.get('days_after_sowing'),
                
                # Environmental factors
                "soil_nitrogen": kwargs.get('nitrogen'),
                "soil_phosphorus": kwargs.get('phosphorus'),
                "soil_potassium": kwargs.get('potassium'),
                "soil_ph": kwargs.get('ph'),
                "soil_moisture": kwargs.get('soil_moisture'),
                
                "temperature": kwargs.get('temperature'),
                "humidity": kwargs.get('humidity'),
                "rainfall": kwargs.get('rainfall'),
                
                # Management factors
                "irrigation_total": kwargs.get('irrigation_total'),
                "fertilizer_applied": kwargs.get('fertilizer_applied'),
                "pest_disease_pressure": kwargs.get('pest_disease_pressure', 'low')
            },
            
            # Prediction results
            "predictions": {
                "expected_yield_per_hectare": kwargs.get('expected_yield'),
                "total_expected_yield": kwargs.get('total_yield'),
                "yield_quality_grade": kwargs.get('quality_grade'),
                "harvest_date_prediction": kwargs.get('predicted_harvest_date'),
                "confidence_score": kwargs.get('confidence_score'),
                
                # Risk factors
                "risk_factors": kwargs.get('risk_factors', []),
                "recommendations": kwargs.get('recommendations', [])
            },
            
            # Model information
            "model_info": {
                "model_version": kwargs.get('model_version', '1.0'),
                "prediction_method": kwargs.get('prediction_method', 'ml_model'),
                "input_features_used": kwargs.get('features_used', [])
            },
            
            # Actual results (filled after harvest)
            "actual_results": {
                "actual_yield": kwargs.get('actual_yield'),
                "actual_harvest_date": kwargs.get('actual_harvest_date'),
                "quality_achieved": kwargs.get('quality_achieved'),
                "accuracy_score": kwargs.get('accuracy_score')
            },
            
            "prediction_date": datetime.utcnow(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "status": kwargs.get('status', 'pending')  # pending, confirmed, completed
        }
    
    @staticmethod
    def update_actual_results(actual_yield, actual_harvest_date, quality_achieved):
        """Update prediction with actual results"""
        return {
            "actual_results.actual_yield": actual_yield,
            "actual_results.actual_harvest_date": actual_harvest_date if isinstance(actual_harvest_date, datetime) else datetime.fromisoformat(actual_harvest_date),
            "actual_results.quality_achieved": quality_achieved,
            "status": "completed",
            "updated_at": datetime.utcnow()
        }

class UserSessionSchema:
    """Schema for tracking user sessions (since no authentication)"""
    
    @staticmethod
    def create_user_session(session_id, ip_address, **kwargs):
        """Create a user session document"""
        return {
            "session_id": session_id,
            "ip_address": ip_address,
            "user_agent": kwargs.get('user_agent'),
            "location": kwargs.get('location'),  # Approximate location from IP
            "preferences": kwargs.get('preferences', {}),
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow(),
            "fields_count": 0,
            "crops_count": 0,
            "predictions_count": 0
        }
    
    @staticmethod
    def update_activity(session_id):
        """Update last activity timestamp"""
        return {
            "last_active": datetime.utcnow()
        }