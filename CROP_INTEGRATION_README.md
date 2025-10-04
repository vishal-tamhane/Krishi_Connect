# Crop Lifecycle Prediction Integration

This integration connects the ML-based crop prediction models with the React frontend through a Flask API.

## Features

- **Frontend Form**: Users can input crop name and sowing date through a clean UI
- **Backend ML Integration**: Flask server loads trained ML models and makes predictions
- **Automatic Data Generation**: Weather and soil data are automatically generated based on seasonal patterns
- **Real-time Results**: Displays growth timeline and irrigation schedule immediately

## Setup Instructions

### 1. Backend Setup (Flask Server)

```bash
cd flaskserver
pip install -r requirement.txt
python app.py
```

The Flask server will start on `http://localhost:5002`

### 2. Frontend Setup (React Client)

```bash
cd client
npm install
npm run dev
```

The React app will start on `http://localhost:5173`

### 3. ML Models

Ensure trained models are available in the `models/trained_models/` directory:
- `duration_[stage]_model.pkl` - Duration prediction models for each growth stage
- `irrigation_[stage]_model.pkl` - Irrigation prediction models for each growth stage
- `feature_columns.pkl` - Feature column definitions

## How to Use

1. **Open the React App**: Navigate to the Crop Lifecycle page
2. **Click "Add New Crop"**: This opens the prediction form
3. **Enter Details**:
   - **Crop Name**: Enter crop type (e.g., Maize, Cotton, Wheat, Rice)
   - **Sowing Date**: Select the planned sowing date
4. **Click "Predict Lifecycle"**: The system will:
   - Send request to Flask backend
   - Generate weather/soil data automatically
   - Load ML models and make predictions
   - Return detailed timeline and irrigation schedule

## API Endpoints

### POST /predict-crop-cycle

Predicts crop lifecycle based on input parameters.

**Request Body:**
```json
{
  "crop_type": "Maize",
  "sowing_date": "2025-12-01"
}
```

**Response:**
```json
{
  "crop": "Maize",
  "sow_date": "2025-12-01",
  "harvest_date": "2025-03-15",
  "total_duration": 105,
  "timeline": [
    {
      "Stage": "Vegetative",
      "Duration_Days": 45,
      "Start": "2025-12-01",
      "End": "2025-01-15",
      "Irrigation_Need": "2.5 lphw"
    }
  ],
  "irrigation_schedule": [
    {
      "Week_Start": "2025-12-01",
      "Week_End": "2025-12-08",
      "Stage": "Vegetative",
      "Irrigation_Need": "2.5 lphw"
    }
  ],
  "generated_data": {
    "weather": {
      "temperature": 28.5,
      "rainfall": 75.2,
      "humidity": 68.3
    },
    "soil": {
      "moisture": 28.5,
      "nitrogen": 1.2,
      "phosphorus": 22.8,
      "potassium": 185.4,
      "ph": 6.8
    }
  }
}
```

## Supported Crops

The system supports various crops based on the trained ML models. Common supported crops include:
- Maize (Corn)
- Cotton
- Wheat
- Rice
- Chickpea
- Soybean

## Automatic Data Generation

The backend automatically generates realistic data based on:

### Weather Data
- **Seasonal patterns**: Different base values for temperature, rainfall, and humidity by season
- **Randomization**: Adds realistic variation to base seasonal values

### Soil Data
- **Moisture**: 20-35% range based on typical soil conditions
- **Nutrients**: Realistic NPK values for agricultural soil
- **pH**: Typical agricultural soil pH range (6.0-7.5)

## Testing

Run the integration test:
```bash
python test_integration.py
```

This will test:
- Flask server accessibility
- Crop prediction endpoint functionality
- Response data structure

## Error Handling

The system includes comprehensive error handling:
- **Missing Models**: Graceful fallback if ML models aren't available
- **Invalid Crops**: Clear error messages for unsupported crop types  
- **Network Issues**: Frontend displays connection errors
- **Validation**: Input validation on both frontend and backend

## Folder Structure

```
├── client/src/pages/CropLifecycle.jsx  # React frontend component
├── flaskserver/app.py                  # Flask backend with ML integration
├── models/predict_crop_cycle.py        # Original ML prediction script
├── models/trained_models/              # ML model files (*.pkl)
└── test_integration.py                 # Integration test script
```

## Future Enhancements

1. **Real Weather API**: Integration with actual weather service
2. **Soil Testing**: Connection with soil testing devices/services
3. **Historical Data**: Store and analyze historical crop performance
4. **Advanced Analytics**: More detailed growth stage monitoring
5. **Mobile Support**: Responsive design improvements
6. **Notification System**: Alerts for irrigation and care tasks