

import pandas as pd
import numpy as np
import os
import sys
import joblib
from datetime import datetime, timedelta
import matplotlib.pyplot as plt

# Print diagnostic information
print("Python version:", sys.version)
print("Current working directory:", os.getcwd())

def load_models(models_dir='./trained_models'):
    
    try:
        # Check if models directory exists
        if not os.path.exists(models_dir):
            print(f"ERROR: Models directory not found at {models_dir}")
            
            return None, None, None
            
        duration_files = [f for f in os.listdir(models_dir) if f.startswith('duration_')]
        stages = [f.split('_')[1] for f in duration_files]
        
        print(f"Found models for the following growth stages: {stages}")
        
        # Load duration models
        duration_models = {}
        for stage in stages:
            model_path = f"{models_dir}/duration_{stage}_model.pkl"
            print(f"Loading duration model for {stage} from {model_path}")
            duration_models[stage] = joblib.load(model_path)
        
        # Load irrigation models
        irrigation_models = {}
        for stage in stages:
            model_path = f"{models_dir}/irrigation_{stage}_model.pkl"
            print(f"Loading irrigation model for {stage} from {model_path}")
            irrigation_models[stage] = joblib.load(model_path)
        
        # Load feature columns
        feature_path = f"{models_dir}/feature_columns.pkl"
        print(f"Loading feature columns from {feature_path}")
        feature_columns = joblib.load(feature_path)
        
       
        return duration_models, irrigation_models, feature_columns
    
    except Exception as e:
        print(f"Error loading models: {e}")
        import traceback
        traceback.print_exc()
        return None, None, None

def predict_crop_timeline_and_irrigation(crop_type, sow_date_str, weather_data, soil_data, 
                                         all_feature_cols, duration_models, irrigation_models):
    
    # Get the growth stages from the model keys
    stages = list(duration_models.keys())
    sow_date = datetime.strptime(sow_date_str, '%d-%m-%Y')
    
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
        print(f"WARNING: Crop type '{crop_type}' not found in training data features.")
        print(f"Available crops: {[col.split('_')[1] for col in all_feature_cols if col.startswith('Crop_')]}")
        raise ValueError(f"Crop type '{crop_type}' not found in training data features.")
        
    new_input_df[crop_col_name] = 1

    new_input_df = new_input_df[all_feature_cols]

    pred_durs = {
        stage: max(1, int(duration_models[stage].predict(new_input_df)[0])) 
        for stage in stages
    }
    # Predict Irrigation Needs
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
    
    # Create a more detailed irrigation schedule
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

# def visualize_crop_timeline(results):
    
    # Extract data for visualization
    stages = [t['Stage'] for t in results['timeline']]
    durations = [t['Duration_Days'] for t in results['timeline']]
    irrigation = [float(t['Irrigation_Need'].split()[0]) for t in results['timeline']]
    
    # Create figure with two subplots
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 10), gridspec_kw={'height_ratios': [1, 2]})
    
    # Plot 1: Growth Stage Timeline (Gantt chart)
    y_positions = range(len(stages))
    start_dates = [datetime.strptime(t['Start'], '%Y-%m-%d') for t in results['timeline']]
    end_dates = [datetime.strptime(t['End'], '%Y-%m-%d') for t in results['timeline']]
    
    # Calculate duration in days for width
    widths = [(end - start).days for start, end in zip(start_dates, end_dates)]
    
    # Set colors for different stages
    colors = ['#FF9999', '#66B2FF', '#99FF99', '#FFCC99', '#C2C2F0', '#FFD700']
    
    # Create horizontal bars for each stage
    for i, (stage, start, width, color) in enumerate(zip(stages, start_dates, widths, colors[:len(stages)])):
        ax1.barh(i, width, left=start, height=0.6, color=color, alpha=0.8)
        # Add text labels
        text_x = start + timedelta(days=width/2)
        ax1.text(text_x, i, f"{stage}\n{width} days", ha='center', va='center', fontweight='bold')
    
    # Format first plot
    ax1.set_yticks([])
    ax1.set_title('Crop Growth Timeline', fontsize=14, fontweight='bold')
    ax1.grid(axis='x', linestyle='--', alpha=0.7)
    
    # Format dates on x-axis
    ax1.xaxis.set_major_formatter(plt.matplotlib.dates.DateFormatter('%Y-%m-%d'))
    plt.setp(ax1.xaxis.get_majorticklabels(), rotation=45)
    
    # Plot 2: Irrigation needs per stage (bar chart)
    ax2.bar(stages, irrigation, color=colors[:len(stages)], alpha=0.8)
    ax2.set_title('Irrigation Need by Growth Stage', fontsize=14, fontweight='bold')
    ax2.set_xlabel('Growth Stage')
    ax2.set_ylabel('Irrigation Need (liters/hectare/week)')
    ax2.grid(axis='y', linestyle='--', alpha=0.7)
    
    # Add values on top of bars
    for i, v in enumerate(irrigation):
        ax2.text(i, v + 0.1, f"{v:.2f}", ha='center')
    
    plt.tight_layout()
    plt.savefig('d:/TECH_CODE/AL_ML_Udemy/vortexa/crop_prediction_visualization.png')
    print(f"Visualization saved to d:/TECH_CODE/AL_ML_Udemy/vortexa/crop_prediction_visualization.png")
    plt.show()

# def save_results_to_csv(results, filename='d:/TECH_CODE/AL_ML_Udemy/vortexa/crop_prediction_results.csv'):
    """Saves the weekly irrigation schedule to a CSV file"""
    try:
        # Create a DataFrame from the weekly irrigation schedule
        irrigation_df = pd.DataFrame(results['irrigation_schedule'])
        
        # Add crop and sowing information
        irrigation_df['Crop'] = results['crop']
        irrigation_df['Sow_Date'] = results['sow_date']
        
        # Save to CSV
        irrigation_df.to_csv(filename, index=False)
        print(f"\nIrrigation schedule saved to {filename}")
        return True
    except Exception as e:
        print(f"Error saving results to CSV: {e}")
        return False

try:
    # 1. Load trained models
    print("Loading trained models...")
    duration_models, irrigation_models, feature_columns = load_models()
    
    if duration_models is None or irrigation_models is None or feature_columns is None:
        print("Failed to load models. Please train the models first.")
        sys.exit(1)
        
    # 2. Define inputs for a new prediction
    # Make a prediction for one of the crops from our actual dataset
    new_crop = input("Enter crop type (e.g., Cotton, Maize, Chickpea, etc.): ") or "Maize"
    new_sow_date = input("Enter sowing date (DD-MM-YYYY, e.g., 15-06-2026): ") or "15-06-2026"
    
    # Weather and soil data
    temp = float(input("Enter average temperature in Celsius: ") or "27.5")
    rainfall = float(input("Enter expected rainfall in mm: ") or "500")
    humidity = float(input("Enter average humidity percentage: ") or "70")
    soil_moisture = float(input("Enter soil moisture percentage: ") or "25")
    
    new_weather_data = {
        'temperature': temp,
        'rainfall': rainfall,
        'humidity': humidity
    }
    new_soil_data = {
        'moisture': soil_moisture
    }
    
    # 3. Make prediction
    print(f"\nMaking prediction for {new_crop} sown on {new_sow_date}...")
    results = predict_crop_timeline_and_irrigation(
        crop_type=new_crop, 
        sow_date_str=new_sow_date, 
        weather_data=new_weather_data, 
        soil_data=new_soil_data, 
        all_feature_cols=feature_columns,
        duration_models=duration_models,
        irrigation_models=irrigation_models
    )
    
    # 4. Display results
    print(f"\n=======================================================")
    print(f"CROP CYCLE PREDICTION FOR: {results['crop']}")
    print(f"=======================================================")
    print(f"Sowing Date: {results['sow_date']}")
    print(f"Estimated Harvest Date: {results['harvest_date']}")
    print(f"Total Growing Season: {results['total_duration']} days")

    print("\n--- Growth Stage Timeline ---")
    print("STAGE            | DURATION | START DATE  | END DATE    | IRRIGATION NEED")
    print("-" * 75)
    for t in results['timeline']:
        print(f"{t['Stage']:<16} | {t['Duration_Days']:<8} | {t['Start']} | {t['End']} | {t['Irrigation_Need']}")

    print("\n--- Weekly Irrigation Schedule ---")
    print("WEEK START  | WEEK END    | STAGE           | IRRIGATION NEED")
    print("-" * 65)
    for week in results['irrigation_schedule']:
        print(f"{week['Week_Start']} | {week['Week_End']} | {week['Stage']:<15} | {week['Irrigation_Need']}")
    
    # 5. Save results and visualize
    # save_results_to_csv(results)
    # visualize_crop_timeline(results)
    
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)