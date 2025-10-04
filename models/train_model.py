

import pandas as pd
import numpy as np
from datetime import datetime
import os
import sys
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib

# Print diagnostic information
# print("Python version:", sys.version)
# print("Current working directory:", os.getcwd())

try:
    # 1. Load the actual CSV data
    file_path = 'd:/TECH_CODE/AL_ML_Udemy/vortexa/crop_data_synthetic_realistic.csv'
    print(f"Attempting to load data from: {file_path}")
    
    if not os.path.exists(file_path):
        print(f"ERROR: CSV file not found at {file_path}")
        sys.exit(1)
        
    df = pd.read_csv(file_path)

    # 2. Display information about the dataset
    print(f"Dataset Shape: {df.shape}")
    print("\nColumns in the dataset:")
    print(df.columns.tolist())
    
    # 3. Identify the growth stages from the column names
    growth_stages = [col.split('_')[0] for col in df.columns if col.endswith('_Dur')]
    print(f"\nIdentified Growth Stages: {growth_stages}")

    # 4. Get unique crops in the dataset
    crops = df['Crop'].unique()
    print(f"\nUnique Crops in Dataset: {crops}")
    
    # 5. Convert month names to numbers if they are text
    if df['Sow_Month'].dtype == 'object':
        print("\nConverting month names to numbers...")
        month_to_num = {
            'January': 1, 'February': 2, 'March': 3, 'April': 4, 
            'May': 5, 'June': 6, 'July': 7, 'August': 8, 
            'September': 9, 'October': 10, 'November': 11, 'December': 12
        }
        df['Sow_Month'] = df['Sow_Month'].map(month_to_num)
        print(f"Months converted: {df['Sow_Month'].unique()}")

    # 6. Data preprocessing
    # Features: crop type, year, sowing month, and environmental conditions
    X = df[['Crop', 'Year', 'Sow_Month', 'Temp_C', 'Rainfall_mm', 'Humidity_%', 'SoilMoist_%']]

    # Targets: duration of each growth stage
    y_durations = df[[f'{stage}_Dur' for stage in growth_stages]]

    # Also prepare targets for irrigation needs
    y_irrigation = df[[f'{stage}_Irrig_lphw' for stage in growth_stages]]

    # ONE-HOT ENCODING for crop types
    X = pd.get_dummies(X, columns=['Crop'])
    print(f"\nTotal features after encoding: {X.shape[1]}")

    # Split data for model training
    X_train, X_test, y_dur_train, y_dur_test = train_test_split(
        X, y_durations, test_size=0.2, random_state=1
    )

    # Also split data for irrigation prediction (using same split as above)
    _, _, y_irr_train, y_irr_test = train_test_split(
        X, y_irrigation, test_size=0.2, random_state=1
    )

    duration_models = {}
    print("\n--- Training Growth Duration Models ---")
    for stage in growth_stages:
        print(f"Training model for {stage} duration prediction...")
        rf = RandomForestRegressor(n_estimators=100, random_state=1, n_jobs=-1)
        rf.fit(X_train, y_dur_train[f'{stage}_Dur'])
        duration_models[stage] = rf
        
        # Calculate model performance
        y_pred = rf.predict(X_test)
        r2 = r2_score(y_dur_test[f'{stage}_Dur'], y_pred)
        rmse = np.sqrt(mean_squared_error(y_dur_test[f'{stage}_Dur'], y_pred))
        
        print(f"  {stage} duration model: R² = {r2:.4f}, RMSE = {rmse:.2f} days")

    # Models for predicting irrigation needs
    irrigation_models = {}
    print("\n--- Training Irrigation Need Models ---")
    for stage in growth_stages:
        print(f"Training model for {stage} irrigation prediction...")
        rf = RandomForestRegressor(n_estimators=100, random_state=1, n_jobs=-1)
        rf.fit(X_train, y_irr_train[f'{stage}_Irrig_lphw'])
        irrigation_models[stage] = rf
        
        # Calculate model performance
        y_pred = rf.predict(X_test)
        r2 = r2_score(y_irr_test[f'{stage}_Irrig_lphw'], y_pred)
        rmse = np.sqrt(mean_squared_error(y_irr_test[f'{stage}_Irrig_lphw'], y_pred))
        
        print(f"  {stage} irrigation model: R² = {r2:.4f}, RMSE = {rmse:.2f} lphw")

    # 7. SAVE TRAINED MODELS
    models_dir = 'd:/TECH_CODE/AL_ML_Udemy/vortexa/trained_models'
    if not os.path.exists(models_dir):
        print(f"\nCreating models directory: {models_dir}")
        os.makedirs(models_dir)

    # Save duration models
    print("\nSaving trained models...")
    for stage, model in duration_models.items():
        model_path = f"{models_dir}/duration_{stage}_model.pkl"
        print(f"  Saving duration model for {stage}")
        joblib.dump(model, model_path)
    
    # Save irrigation models
    for stage, model in irrigation_models.items():
        model_path = f"{models_dir}/irrigation_{stage}_model.pkl"
        print(f"  Saving irrigation model for {stage}")
        joblib.dump(model, model_path)
    
    # Save feature columns
    feature_path = f"{models_dir}/feature_columns.pkl"
    print(f"  Saving feature columns")
    joblib.dump(X.columns, feature_path)
    
    print(f"\nAll models saved successfully to {models_dir} directory")
    print("\nModel training complete!")
    
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)