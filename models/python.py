
try:
    import pandas as pd
    import numpy as np
    from datetime import datetime, timedelta
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.model_selection import train_test_split
    import matplotlib.pyplot as plt
    from sklearn.metrics import mean_squared_error, r2_score
    import joblib
    import os
    import sys
    
    print("All required libraries imported successfully.")
except ImportError as e:
    print(f"Error importing libraries: {e}")
    # print("Please make sure you have installed all required packages:")
    # print("pip install pandas numpy scikit-learn matplotlib joblib")
    sys.exit(1)

try:
    # Load the actual CSV data
    file_path = 'd:/TECH_CODE/AL_ML_Udemy/vortexa/crop_data_synthetic_realistic.csv'
    print(f"Attempting to load data from: {file_path}")
    if not os.path.exists(file_path):
        print(f"ERROR: CSV file not found at {file_path}")
        sys.exit(1)
        
    df = pd.read_csv(file_path)

except Exception as e:
    print(f"Error loading or processing data: {e}")
    sys.exit(1)

# Check for missing values
missing_values = df.isnull().sum()
if missing_values.sum() > 0:
    print("\nMissing Values:")
    print(missing_values[missing_values > 0])
    df = df.dropna()


growth_stages = [col.split('_')[0] for col in df.columns if col.endswith('_Dur')]
print(f"\nIdentified Growth Stages: {growth_stages}")

# Get unique crops in the dataset
crops = df['Crop'].unique()
print(f"\nUnique Crops in Dataset: {crops}")

month_to_num = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4, 
    'May': 5, 'June': 6, 'July': 7, 'August': 8, 
    'September': 9, 'October': 10, 'November': 11, 'December': 12
}

if df['Sow_Month'].dtype == 'object':
    df['Sow_Month'] = df['Sow_Month'].map(month_to_num)

X = df[['Crop', 'Year', 'Sow_Month', 'Temp_C', 'Rainfall_mm', 'Humidity_%', 'SoilMoist_%']]

y_durations = df[[f'{stage}_Dur' for stage in growth_stages]]


y_irrigation = df[[f'{stage}_Irrig_lphw' for stage in growth_stages]]

X = pd.get_dummies(X, columns=['Crop'])
print(f"Total features after encoding: {X.shape[1]}")
print("New feature columns (Crop dummy variables):", [col for col in X.columns if 'Crop_' in col])

# 1.3 Split data for duration prediction
X_train, X_test, y_dur_train, y_dur_test = train_test_split(
    X, y_durations, test_size=0.2, random_state=1
)

_, _, y_irr_train, y_irr_test = train_test_split(
    X, y_irrigation, test_size=0.2, random_state=1  # Same split as above
)

# 2. MODEL TRAINING (One Random Forest per growth stage for both duration and irrigation)

duration_models = {}
print("\n--- Growth Duration Model Training Results (R²) ---")
for stage in growth_stages:
    rf = RandomForestRegressor(n_estimators=100, random_state=1, n_jobs=-1)
    rf.fit(X_train, y_dur_train[f'{stage}_Dur'])
    duration_models[stage] = rf
    
    # Calculate model performance
    y_pred = rf.predict(X_test)
    r2 = r2_score(y_dur_test[f'{stage}_Dur'], y_pred)
    rmse = np.sqrt(mean_squared_error(y_dur_test[f'{stage}_Dur'], y_pred))
    
    print(f"{stage} duration model: R² = {r2:.4f}, RMSE = {rmse:.2f} days")
    
    features = X.columns.tolist()
    importances = rf.feature_importances_
    indices = np.argsort(importances)[-5:]  # Top 5 features
    print(f"Top features for {stage}: {[features[i] for i in reversed(indices)]}")

# Models for predicting irrigation needs
irrigation_models = {}
print("\n--- Irrigation Need Model Training Results (R²) ---")
for stage in growth_stages:
    rf = RandomForestRegressor(n_estimators=100, random_state=1, n_jobs=-1)
    rf.fit(X_train, y_irr_train[f'{stage}_Irrig_lphw'])
    irrigation_models[stage] = rf
    
    # Calculate model performance
    y_pred = rf.predict(X_test)
    r2 = r2_score(y_irr_test[f'{stage}_Irrig_lphw'], y_pred)
    rmse = np.sqrt(mean_squared_error(y_irr_test[f'{stage}_Irrig_lphw'], y_pred))
    
    print(f"{stage} irrigation model: R² = {r2:.4f}, RMSE = {rmse:.2f} lphw")

# 3. PREDICTION FUNCTION FOR NEW DATA
def predict_crop_timeline_and_irrigation(crop_type, sow_date_str, weather_data, soil_data, 
                                         all_feature_cols, duration_models, irrigation_models):
    
    # Get the growth stages from the model keys
    stages = list(duration_models.keys())
    sow_date = datetime.strptime(sow_date_str, '%d-%m-%Y')
    
    # --- 3.1 Preprocess New Input (Crucial step for new crops) ---
    
    # Create the base input dictionary
    input_data = {
        'Year': sow_date.year,
        'Sow_Month': sow_date.month,
        'Temp_C': weather_data['temperature'],
        'Rainfall_mm': weather_data['rainfall'],
        'Humidity_%': weather_data['humidity'],
        'SoilMoist_%': soil_data['moisture']
    }
    
    # Initialize all one-hot encoded crop columns to 0
    new_input_df = pd.DataFrame([input_data])
    for col in all_feature_cols:
        if col not in new_input_df.columns:
             new_input_df[col] = 0
             
    # Set the specific crop column to 1
    crop_col_name = f'Crop_{crop_type}'
    if crop_col_name not in all_feature_cols:
        # This handles a scenario where the new crop wasn't in the training data
        raise ValueError(f"Crop type '{crop_type}' not found in training data features.")
        
    new_input_df[crop_col_name] = 1
    
    # Reorder columns to match the training data
    new_input_df = new_input_df[all_feature_cols]

    # --- 3.2 Predict Growth Durations ---
    pred_durs = {
        stage: max(1, int(duration_models[stage].predict(new_input_df)[0])) 
        for stage in stages
    }

    # --- 3.3 Predict Irrigation Needs (Using trained models) ---
    pred_irrigation = {
        stage: max(0.1, float(irrigation_models[stage].predict(new_input_df)[0]))
        for stage in stages
    }

    # --- 3.4 Compute Timeline ---
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

    # Calculate the total growing season length
    total_days = sum(pred_durs.values())
    harvest_date = sow_date + timedelta(days=total_days)
    
    # Create a more detailed irrigation schedule
    irrigation_schedule = []
    current = sow_date
    for stage in stages:
        # Create weekly irrigation recommendations throughout the stage
        stage_duration = pred_durs[stage]
        stage_end = current + timedelta(days=stage_duration)
        stage_irrigation = pred_irrigation[stage]
        
        # Create weekly entries
        week_start = current
        while week_start < stage_end:
            week_end = min(week_start + timedelta(days=7), stage_end)
            days_in_week = (week_end - week_start).days
            
            # Adjust irrigation based on the fraction of the week that falls within this stage
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
# 4. EXAMPLE USAGE: Predict for a new crop

new_crop = 'Maize'  # One of the crops in our dataset
new_sow_date = '15-06-2026'
new_weather_data = {
    'temperature': 27.5, 
    'rainfall': 500,     
    'humidity': 70       
}
new_soil_data = {
    'moisture': 25        # Soil moisture percentage
}

# The list of all feature columns from the training set is essential!
all_feature_columns = X.columns.tolist()

results = predict_crop_timeline_and_irrigation(
    crop_type=new_crop, 
    sow_date_str=new_sow_date, 
    weather_data=new_weather_data, 
    soil_data=new_soil_data, 
    all_feature_cols=all_feature_columns, 
    duration_models=duration_models,
    irrigation_models=irrigation_models
)
# 5. DISPLAY RESULTS

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

# ----------------------------------------------------------------------
# 6. DATA VISUALIZATION
# ----------------------------------------------------------------------

# def visualize_crop_timeline(results):
    """Creates a visualization of the crop growth timeline and irrigation needs"""
    
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
    plt.show()

# Visualize the results
# visualize_crop_timeline(results)

# 7. SAVE RESULTS AND MODELS
# Create directory for models if it doesn't exist
models_dir = 'd:/TECH_CODE/AL_ML_Udemy/vortexa/trained_models'
if not os.path.exists(models_dir):
    print(f"Creating models directory: {models_dir}")
    os.makedirs(models_dir)

# Save the trained models
def save_models(duration_models, irrigation_models, models_dir='d:/TECH_CODE/AL_ML_Udemy/vortexa/trained_models'):
    """Saves the trained models to disk"""
    try:
        # Save duration models
        for stage, model in duration_models.items():
            model_path = f"{models_dir}/duration_{stage}_model.pkl"
            print(f"Saving duration model for {stage} to {model_path}")
            joblib.dump(model, model_path)
        
        # Save irrigation models
        for stage, model in irrigation_models.items():
            model_path = f"{models_dir}/irrigation_{stage}_model.pkl"
            print(f"Saving irrigation model for {stage} to {model_path}")
            joblib.dump(model, model_path)
        
        # Save feature columns
        feature_path = f"{models_dir}/feature_columns.pkl"
        print(f"Saving feature columns to {feature_path}")
        joblib.dump(X.columns, feature_path)
        
        print(f"\nAll models saved successfully to {models_dir} directory")
        return True
    except Exception as e:
        print(f"Error saving models: {e}")
        return False

# Load trained models
def load_models(models_dir='d:/TECH_CODE/AL_ML_Udemy/vortexa/trained_models'):
    """Loads trained models from disk"""
    try:
        # Get list of growth stages from saved model files
        duration_files = [f for f in os.listdir(models_dir) if f.startswith('duration_')]
        stages = [f.split('_')[1] for f in duration_files]
        
        # Load duration models
        duration_models = {}
        for stage in stages:
            duration_models[stage] = joblib.load(f"{models_dir}/duration_{stage}_model.pkl")
        
        # Load irrigation models
        irrigation_models = {}
        for stage in stages:
            irrigation_models[stage] = joblib.load(f"{models_dir}/irrigation_{stage}_model.pkl")
        
        # Load feature columns
        feature_columns = joblib.load(f"{models_dir}/feature_columns.pkl")
        
        print("Models loaded successfully!")
        return duration_models, irrigation_models, feature_columns
    except Exception as e:
        print(f"Error loading models: {e}")
        return None, None, None

# Save the prediction results to a CSV file
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

# try:
#     # Save trained models
#     print("\nSaving trained models for future use...")
#     save_models(duration_models, irrigation_models)

#     # Save prediction results
#     save_results_to_csv(results)

#     print("\nModel training and prediction complete!")
#     print("You can now use the trained models to make predictions for different crops and conditions.")
#     print("To load the models in a new script, use the load_models() function.")
# except Exception as e:
#     print(f"Error in saving process: {e}")
#     print("Training completed but saving failed.")