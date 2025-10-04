# MongoDB API Documentation

This document describes the new MongoDB-powered API endpoints for field mapping, crop lifecycle tracking, and yield predictions.

## Base URL
```
http://localhost:5002/api
```

## Authentication
No authentication required. User sessions are tracked automatically via IP address.

---

## Field Mapping Endpoints

### Create Field Map
**POST** `/api/fields`

Create a new field map with coordinates and soil parameters.

**Request Body:**
```json
{
  "field_name": "North Field",
  "coordinates": [
    {"lat": 19.0760, "lng": 72.8777},
    {"lat": 19.0770, "lng": 72.8787},
    {"lat": 19.0780, "lng": 72.8777}
  ],
  "area": 2.5,
  "soil_type": "Clay Loam",
  "elevation": 50,
  "slope": "gentle",
  "drainage": "good",
  "nitrogen": 25.5,
  "phosphorus": 18.0,
  "potassium": 22.0,
  "ph": 6.8,
  "organic_matter": 3.2,
  "moisture": 28.5,
  "avg_temperature": 26.5,
  "annual_rainfall": 850,
  "humidity": 65
}
```

**Response:**
```json
{
  "success": true,
  "message": "Field map created successfully",
  "data": {
    "_id": "field_id",
    "field_name": "North Field",
    "coordinates": [...],
    "area": 2.5,
    "soil_parameters": {...},
    "weather_data": {...},
    "created_at": "2025-09-24T10:00:00Z"
  }
}
```

### Get User Fields
**GET** `/api/fields`

Get all field maps for current user session.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "field_id",
      "field_name": "North Field",
      "area": 2.5,
      "created_at": "2025-09-24T10:00:00Z"
    }
  ]
}
```

### Get Specific Field
**GET** `/api/fields/{field_id}`

### Update Field Map
**PUT** `/api/fields/{field_id}`

### Delete Field Map
**DELETE** `/api/fields/{field_id}`

---

## Crop Lifecycle Endpoints

### Create Crop Lifecycle
**POST** `/api/crops`

Start tracking a new crop lifecycle with AI-powered predictions.

**Request Body:**
```json
{
  "field_id": "field_id",
  "crop_name": "rice",
  "crop_variety": "Basmati",
  "sowing_date": "2025-09-24",
  "nitrogen": 28.5,
  "phosphorus": 16.0,
  "potassium": 24.0,
  "ph": 6.9,
  "temperature": 26.0,
  "humidity": 70,
  "rainfall": 120,
  "soil_moisture": 32.0,
  "irrigation_method": "drip"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Crop lifecycle created successfully",
  "data": {
    "_id": "crop_id",
    "crop_name": "rice",
    "sowing_date": "2025-09-24T00:00:00Z",
    "expected_harvest_date": "2026-01-15T00:00:00Z",
    "growth_stages": [
      {
        "Stage": "germination",
        "Duration_Days": 15,
        "Start": "2025-09-24",
        "End": "2025-10-09",
        "Irrigation_Need": "2.5 lphw"
      }
    ],
    "irrigation_schedule": [...],
    "current_stage": "seeded",
    "status": "active"
  }
}
```

### Get User Crops
**GET** `/api/crops`

### Get Specific Crop
**GET** `/api/crops/{crop_id}`

### Get Field Crops
**GET** `/api/crops/field/{field_id}`

### Update Crop Stage
**POST** `/api/crops/{crop_id}/stage`

**Request Body:**
```json
{
  "stage_name": "flowering",
  "start_date": "2025-11-15",
  "duration_days": 20,
  "notes": "Good flowering observed"
}
```

### Add Irrigation Record
**POST** `/api/crops/{crop_id}/irrigation`

**Request Body:**
```json
{
  "date": "2025-09-25",
  "amount": 25.0,
  "method": "drip",
  "notes": "Morning irrigation"
}
```

### Add Fertilizer Record
**POST** `/api/crops/{crop_id}/fertilizer`

**Request Body:**
```json
{
  "date": "2025-09-30",
  "nutrient_type": "N",
  "amount": 40,
  "application_method": "top_dress",
  "fertilizer_name": "Urea",
  "notes": "First top dressing"
}
```

---

## Yield Prediction Endpoints

### Create Yield Prediction
**POST** `/api/yield-predictions`

Generate AI-powered yield predictions based on current crop conditions.

**Request Body:**
```json
{
  "field_id": "field_id",
  "crop_lifecycle_id": "crop_id",
  "crop_name": "rice",
  "field_area": 2.5,
  "current_stage": "flowering",
  "days_after_sowing": 45,
  "nitrogen": 28.5,
  "phosphorus": 16.0,
  "potassium": 24.0,
  "ph": 6.9,
  "soil_moisture": 30.0,
  "temperature": 26.0,
  "humidity": 70,
  "rainfall": 850,
  "irrigation_total": 200,
  "fertilizer_applied": true,
  "pest_disease_pressure": "low"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Yield prediction created successfully",
  "data": {
    "_id": "prediction_id",
    "predictions": {
      "expected_yield_per_hectare": 6.05,
      "total_expected_yield": 15.13,
      "yield_quality_grade": "A",
      "harvest_date_prediction": "2026-01-15",
      "confidence_score": 87.5,
      "risk_factors": [],
      "recommendations": [
        "Continue current irrigation schedule",
        "Monitor for pest activity during flowering"
      ]
    },
    "prediction_date": "2025-09-24T10:00:00Z"
  }
}
```

### Get User Predictions
**GET** `/api/yield-predictions`

### Get Specific Prediction
**GET** `/api/yield-predictions/{prediction_id}`

### Update Actual Results
**POST** `/api/yield-predictions/{prediction_id}/actual`

**Request Body:**
```json
{
  "actual_yield": 5.8,
  "actual_harvest_date": "2026-01-20",
  "quality_achieved": "A"
}
```

---

## User Session Endpoint

### Get Session Info
**GET** `/api/session`

Get current user session information and statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "ip_address": "192.168.1.1",
    "created_at": "2025-09-24T10:00:00Z",
    "fields_count": 2,
    "crops_count": 1,
    "predictions_count": 3
  }
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (missing/invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error

---

## Data Models

### Field Map Schema
- `user_id`: Session identifier
- `field_name`: User-defined name
- `coordinates`: Array of lat/lng points
- `area`: Field area in hectares
- `soil_parameters`: N, P, K, pH, moisture, organic matter
- `weather_data`: Temperature, rainfall, humidity averages
- `created_at`, `updated_at`: Timestamps

### Crop Lifecycle Schema
- `user_id`: Session identifier
- `field_id`: Reference to field map
- `crop_name`, `crop_variety`: Crop information
- `sowing_date`, `expected_harvest_date`: Timeline
- `sowing_parameters`: Soil/weather conditions at sowing
- `growth_stages`: AI-predicted timeline with stages
- `irrigation`: Schedule and total water used
- `fertilizer`: Application records and totals
- `current_stage`, `status`: Progress tracking

### Yield Prediction Schema
- `user_id`: Session identifier
- `field_id`, `crop_lifecycle_id`: References
- `prediction_parameters`: Input data used for prediction
- `predictions`: AI-generated yield forecasts and recommendations
- `actual_results`: Post-harvest comparison data
- `model_info`: AI model version and method used

---

## Integration Notes

1. **No Authentication**: System works without login/signup
2. **Session Tracking**: Users identified by IP address + session ID
3. **AI Integration**: ML models provide growth stage and irrigation predictions
4. **Real-time Updates**: Crop lifecycle can be updated as season progresses
5. **Prediction Accuracy**: Actual results tracked to improve model performance
6. **Data Persistence**: All data saved to MongoDB for historical analysis