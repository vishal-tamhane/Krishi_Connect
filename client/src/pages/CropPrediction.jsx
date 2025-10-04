import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot,
  faSeedling, 
  faWheatAwn,
  faCarrot,
  faAppleAlt,
  faLeaf,
  faChartLine,
  faCalendarAlt,
  faThermometerHalf,
  faDroplet,
  faCloudSun,
  faStar,
  faCheckCircle,
  faExclamationTriangle,
  faInfoCircle,
  faRefresh,
  faDownload,
  faLocationDot,
  faFlask,
  faWater,
  faSun,
  faEye,
  faSpinner,
  faArrowRight,
  faCog
} from '@fortawesome/free-solid-svg-icons';

// Groq API Configuration - Using environment variables for secure key storage
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = import.meta.env.VITE_GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";

const CropPrediction = () => {
  const [selectedLocation, setSelectedLocation] = useState('current-location');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [showResults, setShowResults] = useState(false);
  
  // Form parameters - Initialize with empty/default values
  const [parameters, setParameters] = useState({
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    temperature: '',
    humidity: '',
    ph: '',
    rainfall: '',
    location: 'Current Location (GPS)'
  });

  // Parameter constraints
  const parameterLimits = {
    nitrogen: { min: 0, max: 100, step: 0.1, unit: '%' },
    phosphorus: { min: 0, max: 100, step: 0.1, unit: '%' },
    potassium: { min: 0, max: 100, step: 0.1, unit: '%' },
    temperature: { min: -10, max: 50, step: 0.1, unit: '°C' },
    humidity: { min: 0, max: 100, step: 1, unit: '%' },
    ph: { min: 0, max: 14, step: 0.1, unit: '' },
    rainfall: { min: 0, max: 10000, step: 1, unit: 'mm/year' }
  };

  const locations = [
    { id: 'current-location', name: 'Current Location (GPS)', climate: 'Temperate' },
    { id: 'mumbai', name: 'Mumbai, Maharashtra', climate: 'Tropical' },
    { id: 'delhi', name: 'Delhi, NCR', climate: 'Semi-arid' },
    { id: 'bangalore', name: 'Bangalore, Karnataka', climate: 'Tropical savanna' },
    { id: 'pune', name: 'Pune, Maharashtra', climate: 'Semi-arid' }
  ];

  // Function to call Groq API for crop prediction
  const callGroqAPI = async (params) => {
    try {
      const prompt = `You are an agricultural AI assistant. Based on the following soil and environmental parameters, predict the top 3 most suitable crops for cultivation. Provide specific, realistic data for Indian agriculture.

Parameters:
- Location: ${params.location}
- Nitrogen: ${params.nitrogen}%
- Phosphorus: ${params.phosphorus}%
- Potassium: ${params.potassium}%
- Temperature: ${params.temperature}°C
- Humidity: ${params.humidity}%
- pH: ${params.ph}
- Rainfall: ${params.rainfall}mm/year

IMPORTANT: Respond ONLY with valid JSON in this exact format (no additional text):
{
  "crops": [
    {
      "name": "crop name",
      "suitability": 85,
      "season": "planting season",
      "plantingWindow": "month range",
      "harvestWindow": "month range",
      "expectedYield": "yield per hectare",
      "marketPrice": "current market price",
      "profitability": "High",
      "waterRequirement": "Medium",
      "difficulty": "Easy",
      "advantages": ["advantage1", "advantage2", "advantage3"],
      "considerations": ["consideration1", "consideration2"],
      "confidence": 88
    }
  ]
}

Requirements:
- suitability and confidence must be numbers (0-100)
- profitability: "Very High", "High", "Medium-High", "Medium", or "Low"
- waterRequirement: "Very High", "High", "Medium", or "Low"  
- difficulty: "Easy", "Medium", or "Hard"
- Focus on crops commonly grown in India
- Ensure recommendations are practical and location-appropriate
- Return exactly 3 crops sorted by suitability (highest first)`;

      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are an agricultural expert AI assistant. Always respond with valid JSON only." },
            { role: "user", content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 3000
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      let responseText = data.choices[0].message.content.trim();
      
      // Clean the response to extract only JSON
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      responseText = responseText.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
      
      try {
        const jsonData = JSON.parse(responseText);
        if (jsonData.crops && Array.isArray(jsonData.crops) && jsonData.crops.length > 0) {
          // Process and validate the crops data
          const processedCrops = jsonData.crops.slice(0, 3).map((crop, index) => ({
            id: index + 1,
            name: crop.name || 'Unknown Crop',
            icon: getCropIcon(crop.name),
            suitability: Math.min(100, Math.max(0, parseInt(crop.suitability) || 0)),
            season: crop.season || 'All Season',
            plantingWindow: crop.plantingWindow || 'Year Round',
            harvestWindow: crop.harvestWindow || 'Year Round',
            expectedYield: crop.expectedYield || 'Variable',
            marketPrice: crop.marketPrice || 'Market Rate',
            profitability: crop.profitability || 'Medium',
            waterRequirement: crop.waterRequirement || 'Medium',
            difficulty: crop.difficulty || 'Medium',
            advantages: Array.isArray(crop.advantages) ? crop.advantages.slice(0, 3) : ['Good choice for the region'],
            considerations: Array.isArray(crop.considerations) ? crop.considerations.slice(0, 2) : ['Monitor weather conditions'],
            confidence: Math.min(100, Math.max(0, parseInt(crop.confidence) || crop.suitability || 0))
          }));
          
          return processedCrops;
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.log('Response text:', responseText);
        throw new Error('Invalid response format from AI');
      }
      
      throw new Error('No valid crops data received');
      
    } catch (error) {
      console.error('Error calling Groq API:', error);
      throw error; // Re-throw instead of falling back to hardcoded data
    }
  };

  // Helper function to get appropriate icon for crop
  const getCropIcon = (cropName) => {
    const name = cropName?.toLowerCase() || '';
    if (name.includes('wheat')) return faWheatAwn;
    if (name.includes('rice')) return faSeedling;
    if (name.includes('corn') || name.includes('maize')) return faLeaf;
    if (name.includes('tomato') || name.includes('fruit')) return faAppleAlt;
    if (name.includes('potato') || name.includes('carrot')) return faCarrot;
    return faSeedling; // default icon
  };



  // Handle parameter changes with validation
  const handleParameterChange = (key, value) => {
    if (key === 'location') {
      setParameters(prev => ({
        ...prev,
        [key]: value
      }));
      return;
    }

    const numValue = parseFloat(value);
    const limits = parameterLimits[key];
    
    if (limits && !isNaN(numValue)) {
      // Clamp value to within limits
      const clampedValue = Math.min(limits.max, Math.max(limits.min, numValue));
      setParameters(prev => ({
        ...prev,
        [key]: clampedValue
      }));
    } else if (value === '') {
      // Allow empty values for user input
      setParameters(prev => ({
        ...prev,
        [key]: ''
      }));
    }
  };

  // Validate all parameters are filled
  const validateParameters = () => {
    const requiredParams = ['nitrogen', 'phosphorus', 'potassium', 'temperature', 'humidity', 'ph', 'rainfall'];
    return requiredParams.every(param => parameters[param] !== '' && parameters[param] !== null && !isNaN(parameters[param]));
  };

  const handleLocationChange = (location) => {
    setSelectedLocation(location);
    setParameters(prev => ({
      ...prev,
      location: locations.find(loc => loc.id === location)?.name || location
    }));
  };

  const getSuitabilityColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSuitabilityBorderColor = (score) => {
    if (score >= 90) return 'border-green-200';
    if (score >= 80) return 'border-blue-200';
    if (score >= 70) return 'border-yellow-200';
    return 'border-red-200';
  };

  const getProfitabilityColor = (level) => {
    switch (level) {
      case 'Very High': return 'text-green-700 bg-green-100';
      case 'High': return 'text-green-600 bg-green-50';
      case 'Medium-High': return 'text-blue-600 bg-blue-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'Easy': return 'text-green-600 bg-green-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    // Validate parameters first
    if (!validateParameters()) {
      setError('Please fill in all parameter fields with valid values.');
      return;
    }

    // Check if API key is available
    if (!GROQ_API_KEY) {
      setError('Groq API key is not configured. Please add VITE_GROQ_API_KEY to your .env file.');
      return;
    }

    setIsAnalyzing(true);
    setShowResults(false);
    setError('');
    
    try {
      const cropPredictions = await callGroqAPI(parameters);
      if (cropPredictions && cropPredictions.length > 0) {
        setPredictions(cropPredictions);
        setShowResults(true);
      } else {
        setError('No crop recommendations could be generated. Please try again with different parameters.');
      }
    } catch (error) {
      console.error('Error analyzing crops:', error);
      setError(`Failed to get crop predictions: ${error.message}. Please check your parameters and try again.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Crop Prediction</h1>
            <p className="text-gray-600 mt-1">Get AI-powered crop recommendations based on your conditions</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              <FontAwesomeIcon 
                icon={faRefresh} 
                className={`mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} 
              />
              {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center">
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Location Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FontAwesomeIcon icon={faLocationDot} className="text-blue-500 mr-2" />
            Location Selection
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name} - {location.climate} Climate
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Soil & Environmental Parameters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <FontAwesomeIcon icon={faFlask} className="text-green-500 mr-2" />
            Soil & Environmental Parameters
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Nitrogen */}
            <div className="space-y-2">
              <label className="flex text-sm font-medium text-gray-700 items-center">
                <FontAwesomeIcon icon={faLeaf} className="text-green-500 mr-2" />
                Nitrogen ({parameterLimits.nitrogen.unit})
              </label>
              <input
                type="number"
                value={parameters.nitrogen}
                onChange={(e) => handleParameterChange('nitrogen', e.target.value)}
                min={parameterLimits.nitrogen.min}
                max={parameterLimits.nitrogen.max}
                step={parameterLimits.nitrogen.step}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder={`Enter value (${parameterLimits.nitrogen.min}-${parameterLimits.nitrogen.max}${parameterLimits.nitrogen.unit})`}
                required
              />
              <p className="text-xs text-gray-500">Range: {parameterLimits.nitrogen.min}-{parameterLimits.nitrogen.max}{parameterLimits.nitrogen.unit}</p>
            </div>

            {/* Phosphorus */}
            <div className="space-y-2">
              <label className="flex text-sm font-medium text-gray-700 items-center">
                <FontAwesomeIcon icon={faSeedling} className="text-orange-500 mr-2" />
                Phosphorus ({parameterLimits.phosphorus.unit})
              </label>
              <input
                type="number"
                value={parameters.phosphorus}
                onChange={(e) => handleParameterChange('phosphorus', e.target.value)}
                min={parameterLimits.phosphorus.min}
                max={parameterLimits.phosphorus.max}
                step={parameterLimits.phosphorus.step}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder={`Enter value (${parameterLimits.phosphorus.min}-${parameterLimits.phosphorus.max}${parameterLimits.phosphorus.unit})`}
                required
              />
              <p className="text-xs text-gray-500">Range: {parameterLimits.phosphorus.min}-{parameterLimits.phosphorus.max}{parameterLimits.phosphorus.unit}</p>
            </div>

            {/* Potassium */}
            <div className="space-y-2">
              <label className="flex text-sm font-medium text-gray-700 items-center">
                <FontAwesomeIcon icon={faWheatAwn} className="text-purple-500 mr-2" />
                Potassium ({parameterLimits.potassium.unit})
              </label>
              <input
                type="number"
                value={parameters.potassium}
                onChange={(e) => handleParameterChange('potassium', e.target.value)}
                min={parameterLimits.potassium.min}
                max={parameterLimits.potassium.max}
                step={parameterLimits.potassium.step}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder={`Enter value (${parameterLimits.potassium.min}-${parameterLimits.potassium.max}${parameterLimits.potassium.unit})`}
                required
              />
              <p className="text-xs text-gray-500">Range: {parameterLimits.potassium.min}-{parameterLimits.potassium.max}{parameterLimits.potassium.unit}</p>
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <label className="flex text-sm font-medium text-gray-700 items-center">
                <FontAwesomeIcon icon={faThermometerHalf} className="text-red-500 mr-2" />
                Temperature ({parameterLimits.temperature.unit})
              </label>
              <input
                type="number"
                value={parameters.temperature}
                onChange={(e) => handleParameterChange('temperature', e.target.value)}
                min={parameterLimits.temperature.min}
                max={parameterLimits.temperature.max}
                step={parameterLimits.temperature.step}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder={`Enter value (${parameterLimits.temperature.min}-${parameterLimits.temperature.max}${parameterLimits.temperature.unit})`}
                required
              />
              <p className="text-xs text-gray-500">Range: {parameterLimits.temperature.min}-{parameterLimits.temperature.max}{parameterLimits.temperature.unit}</p>
            </div>

            {/* Humidity */}
            <div className="space-y-2">
              <label className="flex text-sm font-medium text-gray-700 items-center">
                <FontAwesomeIcon icon={faDroplet} className="text-blue-500 mr-2" />
                Humidity ({parameterLimits.humidity.unit})
              </label>
              <input
                type="number"
                value={parameters.humidity}
                onChange={(e) => handleParameterChange('humidity', e.target.value)}
                min={parameterLimits.humidity.min}
                max={parameterLimits.humidity.max}
                step={parameterLimits.humidity.step}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder={`Enter value (${parameterLimits.humidity.min}-${parameterLimits.humidity.max}${parameterLimits.humidity.unit})`}
                required
              />
              <p className="text-xs text-gray-500">Range: {parameterLimits.humidity.min}-{parameterLimits.humidity.max}{parameterLimits.humidity.unit}</p>
            </div>

            {/* pH */}
            <div className="space-y-2">
              <label className="flex text-sm font-medium text-gray-700 items-center">
                <FontAwesomeIcon icon={faEye} className="text-yellow-500 mr-2" />
                pH Value
              </label>
              <input
                type="number"
                value={parameters.ph}
                onChange={(e) => handleParameterChange('ph', e.target.value)}
                min={parameterLimits.ph.min}
                max={parameterLimits.ph.max}
                step={parameterLimits.ph.step}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder={`Enter value (${parameterLimits.ph.min}-${parameterLimits.ph.max})`}
                required
              />
              <p className="text-xs text-gray-500">Range: {parameterLimits.ph.min}-{parameterLimits.ph.max} (soil acidity/alkalinity)</p>
            </div>

            {/* Rainfall */}
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <label className="flex text-sm font-medium text-gray-700 items-center">
                <FontAwesomeIcon icon={faCloudSun} className="text-cyan-500 mr-2" />
                Rainfall ({parameterLimits.rainfall.unit})
              </label>
              <input
                type="number"
                value={parameters.rainfall}
                onChange={(e) => handleParameterChange('rainfall', e.target.value)}
                min={parameterLimits.rainfall.min}
                max={parameterLimits.rainfall.max}
                step={parameterLimits.rainfall.step}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder={`Enter value (${parameterLimits.rainfall.min}-${parameterLimits.rainfall.max}${parameterLimits.rainfall.unit})`}
                required
              />
              <p className="text-xs text-gray-500">Range: {parameterLimits.rainfall.min}-{parameterLimits.rainfall.max}{parameterLimits.rainfall.unit} (annual precipitation)</p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 mt-1 mr-3" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Analyze Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !validateParameters()}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-lg font-semibold shadow-lg hover:shadow-xl"
            >
              {isAnalyzing ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="mr-3 animate-spin" />
                  Analyzing with AI...
                </>
              ) : !validateParameters() ? (
                <>
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-3" />
                  Fill All Parameters First
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faRobot} className="mr-3" />
                  Analyze & Get Crop Predictions
                  <FontAwesomeIcon icon={faArrowRight} className="ml-3" />
                </>
              )}
            </button>
          </div>
          
          {/* Validation Info */}
          {!validateParameters() && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Please fill in all parameter fields to get AI-powered crop recommendations
              </p>
            </div>
          )}
        </div>

        {/* Current Parameters Summary */}
        {validateParameters() && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FontAwesomeIcon icon={faCog} className="text-blue-500 mr-2" />
              Current Analysis Parameters
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <FontAwesomeIcon icon={faLeaf} className="text-green-500 text-lg mb-2" />
                <div className="font-bold text-gray-900">{parameters.nitrogen}{parameterLimits.nitrogen.unit}</div>
                <div className="text-xs text-gray-600">Nitrogen</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <FontAwesomeIcon icon={faSeedling} className="text-orange-500 text-lg mb-2" />
                <div className="font-bold text-gray-900">{parameters.phosphorus}{parameterLimits.phosphorus.unit}</div>
                <div className="text-xs text-gray-600">Phosphorus</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <FontAwesomeIcon icon={faWheatAwn} className="text-purple-500 text-lg mb-2" />
                <div className="font-bold text-gray-900">{parameters.potassium}{parameterLimits.potassium.unit}</div>
                <div className="text-xs text-gray-600">Potassium</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <FontAwesomeIcon icon={faThermometerHalf} className="text-red-500 text-lg mb-2" />
                <div className="font-bold text-gray-900">{parameters.temperature}{parameterLimits.temperature.unit}</div>
                <div className="text-xs text-gray-600">Temperature</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <FontAwesomeIcon icon={faDroplet} className="text-blue-500 text-lg mb-2" />
                <div className="font-bold text-gray-900">{parameters.humidity}{parameterLimits.humidity.unit}</div>
                <div className="text-xs text-gray-600">Humidity</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <FontAwesomeIcon icon={faEye} className="text-yellow-500 text-lg mb-2" />
                <div className="font-bold text-gray-900">{parameters.ph}</div>
                <div className="text-xs text-gray-600">pH Value</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <FontAwesomeIcon icon={faCloudSun} className="text-cyan-500 text-lg mb-2" />
                <div className="font-bold text-gray-900">{parameters.rainfall}{parameterLimits.rainfall.unit}</div>
                <div className="text-xs text-gray-600">Rainfall</div>
              </div>
            </div>
          </div>
        )}

        {/* AI Predictions - Only show if results are available */}
        {showResults && predictions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faRobot} className="text-blue-500 text-xl mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">Top 3 AI Crop Recommendations</h2>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Best matches for your parameters</span>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm">
                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                  Export Report
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {predictions.map((prediction, index) => (
              <div 
                key={prediction.id} 
                className={`border rounded-lg p-6 ${getSuitabilityBorderColor(prediction.suitability)} hover:shadow-md transition-shadow`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <FontAwesomeIcon icon={prediction.icon} className="text-blue-600 text-lg" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{prediction.name}</h3>
                      <p className="text-gray-600">{prediction.season}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSuitabilityColor(prediction.suitability)}`}>
                      <FontAwesomeIcon icon={faStar} className="mr-1" />
                      {prediction.suitability}% Match
                    </div>
                    <div className="text-xs text-gray-500 mt-1">#{index + 1} Recommended</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Planting Window</div>
                    <div className="font-semibold text-gray-900">{prediction.plantingWindow}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Harvest Window</div>
                    <div className="font-semibold text-gray-900">{prediction.harvestWindow}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Expected Yield</div>
                    <div className="font-semibold text-gray-900">{prediction.expectedYield}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Market Price</div>
                    <div className="font-semibold text-gray-900">{prediction.marketPrice}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getProfitabilityColor(prediction.profitability)}`}>
                    Profitability: {prediction.profitability}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(prediction.difficulty)}`}>
                    Difficulty: {prediction.difficulty}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium text-blue-600 bg-blue-50">
                    Water: {prediction.waterRequirement}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium text-gray-600 bg-gray-100">
                    Confidence: {prediction.confidence}%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-2" />
                      Advantages
                    </h4>
                    <ul className="space-y-1">
                      {prediction.advantages.map((advantage, advIndex) => (
                        <li key={advIndex} className="text-sm text-gray-700 flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          {advantage}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 mr-2" />
                      Considerations
                    </h4>
                    <ul className="space-y-1">
                      {prediction.considerations.map((consideration, consIndex) => (
                        <li key={consIndex} className="text-sm text-gray-700 flex items-start">
                          <span className="text-yellow-500 mr-2">•</span>
                          {consideration}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Additional Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <FontAwesomeIcon icon={faInfoCircle} className="text-blue-600 mt-1 mr-3" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">How AI Predictions Work</h3>
              <p className="text-blue-800 text-sm leading-relaxed mb-3">
                Our AI-powered crop prediction system uses advanced language models to analyze your specific soil and environmental parameters. 
                The system considers multiple factors including nitrogen, phosphorus, potassium levels, temperature, humidity, pH, and rainfall 
                to provide personalized crop recommendations for Indian agriculture.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">✓ Real-time Analysis</h4>
                  <p className="text-blue-700">Live AI processing based on your exact parameters</p>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">✓ Location-Specific</h4>
                  <p className="text-blue-700">Recommendations tailored to Indian farming conditions</p>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">✓ Top 3 Crops</h4>
                  <p className="text-blue-700">Best matches ranked by suitability score</p>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">✓ Comprehensive Data</h4>
                  <p className="text-blue-700">Yield, profitability, and cultivation details</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropPrediction;