// This file contains API URLs and other configuration values
// Determine if we're in production based on environment
const isDevelopment = import.meta.env ? import.meta.env.DEV : (process.env.NODE_ENV === 'development');

// Get Flask backend URL - Force production URL if not in development
const FLASK_BACKEND_URL = isDevelopment 
  ? (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5002')
  : 'https://krishi-mitra-backend-sdsb.onrender.com';

// Debug logging
console.log('Environment check:', {
  isDevelopment,
  VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
  FLASK_BACKEND_URL
});

// Client URL configuration
const CLIENT_URL = isDevelopment
  ? 'http://localhost:5173'
  : window.location.origin;

// Flask Backend API URLs
export const API_URLS = {
  // Server status
  STATUS: `${FLASK_BACKEND_URL}/api/status`,
  
  // Field Management
  FIELDS: `${FLASK_BACKEND_URL}/api/fields`,
  FIELD_BY_ID: (fieldId) => `${FLASK_BACKEND_URL}/api/fields/${fieldId}`,
  
  // Crop Lifecycle Management
  CROPS: `${FLASK_BACKEND_URL}/api/crops`,
  CROP_BY_ID: (cropId) => `${FLASK_BACKEND_URL}/api/crops/${cropId}`,
  CROPS_BY_FIELD: (fieldId) => `${FLASK_BACKEND_URL}/api/crops/field/${fieldId}`,
  CROP_STAGE_UPDATE: (cropId) => `${FLASK_BACKEND_URL}/api/crops/${cropId}/stage`,
  CROP_IRRIGATION: (cropId) => `${FLASK_BACKEND_URL}/api/crops/${cropId}/irrigation`,
  CROP_FERTILIZER: (cropId) => `${FLASK_BACKEND_URL}/api/crops/${cropId}/fertilizer`,
  
  // Yield Prediction
  YIELD_PREDICTIONS: `${FLASK_BACKEND_URL}/api/yield-predictions`,
  YIELD_PREDICTION_BY_ID: (predictionId) => `${FLASK_BACKEND_URL}/api/yield-predictions/${predictionId}`,
  YIELD_ACTUAL_UPDATE: (predictionId) => `${FLASK_BACKEND_URL}/api/yield-predictions/${predictionId}/actual`,
  
  // User Session
  SESSION: `${FLASK_BACKEND_URL}/api/session`,
  
  // Legacy ML endpoints (still available in Flask)
  CROP_CYCLE_PREDICTION: `${FLASK_BACKEND_URL}/predict-crop-cycle`,
  CROP_INFO: `${FLASK_BACKEND_URL}/crop-info`,
  GROWTH_STAGES: `${FLASK_BACKEND_URL}/growth-stages`,
  IRRIGATION_SCHEDULE: `${FLASK_BACKEND_URL}/irrigation-schedule`,
  FERTILIZER_SCHEDULE: `${FLASK_BACKEND_URL}/fertilizer-schedule`,
  WATER_BALANCE: `${FLASK_BACKEND_URL}/water-balance-summary`,
  
  // Plant Disease Detection
  UPLOAD_DISEASE_IMAGE: `${FLASK_BACKEND_URL}/api/upload-disease-image`,
  DISEASE_IMAGE_RESULT: (imagePath) => `${FLASK_BACKEND_URL}${imagePath}`
};

// Groq API Configuration for AI Assistant
export const GROQ_CONFIG = {
  API_KEY: import.meta.env.VITE_GROQ_API_KEY,
  API_URL: import.meta.env.VITE_GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions',
  MODEL: 'llama3-8b-8192' // Default model, can be changed as needed
};

export default {
  FLASK_BACKEND_URL,
  CLIENT_URL,
  API_URLS,
  GROQ_CONFIG
};
