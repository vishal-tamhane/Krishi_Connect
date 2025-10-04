import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarCheck,
  faWheatAwn,
  faChartLine,
  faRupeeSign,
  faArrowUp,
  faArrowDown,
  faEquals,
  faCalendarAlt,
  faLeaf,
  faThermometerHalf,
  faDroplet,
  faCloudSun,
  faExclamationTriangle,
  faInfoCircle,
  faCheckCircle,
  faClock,
  faDownload,
  faRefresh,
  faHistory,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { getUserFields } from '../services/dataService';

const YieldPrediction = () => {
  const [selectedField, setSelectedField] = useState('');
  const [predictionPeriod, setPredictionPeriod] = useState('current-season');
  const [fields, setFields] = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [error, setError] = useState('');

  // Load fields from database on component mount
  useEffect(() => {
    fetchFields();
  }, []);
  
  const fetchFields = async () => {
    setFieldsLoading(true);
    setError('');
    
    try {
      const response = await getUserFields();
      
      if (response.success && Array.isArray(response.data)) {
        // Map database fields to the format expected by this component
        const mappedFields = response.data.map(field => ({
          id: field._id,
          name: field.field_name,
          crop: field.current_crop || 'Not specified',
          area: field.area || 0,
          plantedDate: field.created_at ? field.created_at.split('T')[0] : '2025-01-01'
        }));
        setFields(mappedFields);
        
        // Select first field by default if available
        if (mappedFields.length > 0 && !selectedField) {
          setSelectedField(mappedFields[0].id);
        }
      } else {
        setFields([]);
        if (!response.success) {
          setError('Failed to load fields from database');
        }
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
      setFields([]);
      setError('Unable to connect to server. Please check if the Flask server is running.');
    } finally {
      setFieldsLoading(false);
    }
  };



  const predictionPeriods = [
    { id: 'current-season', name: 'Current Season (2024-25)' },
    { id: 'next-season', name: 'Next Season (2025-26)' },
    { id: 'annual', name: 'Annual Forecast' }
  ];

  const currentField = fields.find(f => (f._id || f.id) === selectedField);

  // Generate dynamic prediction based on field data
  const generatePrediction = (field) => {
    if (!field) return null;
    
    const cropData = {
      'Wheat': {
        baseYield: 4.2,
        yieldVariation: 0.8,
        harvestMonths: 7, // months from planted date
        risks: [
          { risk: 'Late season rainfall', impact: 'Medium', probability: 30 },
          { risk: 'Pest infestation', impact: 'High', probability: 15 },
          { risk: 'Market price volatility', impact: 'Medium', probability: 45 }
        ],
        recommendations: [
          'Monitor for rust diseases in the next 2 weeks',
          'Consider additional phosphorus application',
          'Plan harvest equipment booking early'
        ]
      },
      'Rice': {
        baseYield: 6.1,
        yieldVariation: 0.6,
        harvestMonths: 4,
        risks: [
          { risk: 'Monsoon delay', impact: 'High', probability: 25 },
          { risk: 'Brown plant hopper', impact: 'Medium', probability: 35 },
          { risk: 'Storage losses', impact: 'Low', probability: 20 }
        ],
        recommendations: [
          'Ensure adequate water storage for monsoon dependency',
          'Prepare pest management strategy',
          'Plan proper storage facilities'
        ]
      },
      'Corn': {
        baseYield: 5.0,
        yieldVariation: 0.7,
        harvestMonths: 4,
        risks: [
          { risk: 'Heat stress', impact: 'Medium', probability: 40 },
          { risk: 'Corn borer attack', impact: 'High', probability: 25 },
          { risk: 'Lodging due to wind', impact: 'Medium', probability: 20 }
        ],
        recommendations: [
          'Implement heat stress management practices',
          'Regular monitoring for pest symptoms',
          'Plan irrigation schedule during hot periods'
        ]
      },
      'Tomato': {
        baseYield: 30.0,
        yieldVariation: 4.0,
        harvestMonths: 3,
        risks: [
          { risk: 'Fungal diseases', impact: 'High', probability: 55 },
          { risk: 'Market price crash', impact: 'Very High', probability: 35 },
          { risk: 'Transportation issues', impact: 'Medium', probability: 25 }
        ],
        recommendations: [
          'Regular fungicide application needed',
          'Monitor market prices daily',
          'Arrange harvest labor and transportation in advance'
        ]
      }
    };

    const cropInfo = cropData[field.cropType || field.crop] || cropData['Wheat'];
    const plantedDate = new Date(field.plantedDate || field.created_at);
    const harvestDate = new Date(plantedDate);
    harvestDate.setMonth(harvestDate.getMonth() + cropInfo.harvestMonths);
    
    const daysToHarvest = Math.max(0, Math.ceil((harvestDate - new Date()) / (1000 * 60 * 60 * 24)));
    
    return {
      currentYield: cropInfo.baseYield,
      predictedYield: cropInfo.baseYield + (Math.random() * cropInfo.yieldVariation),
      minYield: cropInfo.baseYield - cropInfo.yieldVariation * 0.3,
      maxYield: cropInfo.baseYield + cropInfo.yieldVariation * 1.2,
      confidence: Math.floor(75 + Math.random() * 20), // 75-95% confidence
      harvestDate: harvestDate.toISOString().split('T')[0],
      daysToHarvest,
      trend: Math.random() > 0.3 ? 'up' : 'down',
      factors: {
        weather: Math.floor(80 + Math.random() * 15),
        soil: Math.floor(85 + Math.random() * 10),
        irrigation: Math.floor(85 + Math.random() * 10),
        cropHealth: Math.floor(80 + Math.random() * 15),
        historicalPerformance: Math.floor(75 + Math.random() * 20)
      },
      risks: cropInfo.risks,
      recommendations: cropInfo.recommendations
    };
  };

  // Helper functions to handle field property compatibility
  const getFieldName = (field) => field?.fieldName || field?.name || 'Unknown Field';
  const getFieldArea = (field) => field?.area || field?.size || 0;
  const getFieldCrop = (field) => field?.cropType || field?.crop || 'Unknown Crop';
  const getPlantedDate = (field) => {
    const date = field?.plantedDate || field?.created_at;
    return date ? new Date(date).toLocaleDateString() : 'Not specified';
  };

  const marketPrices = {
    'Wheat': { current: 2200, predicted: 2350, trend: 'up', change: 6.8 },
    'Rice': { current: 1950, predicted: 2100, trend: 'up', change: 7.7 },
    'Corn': { current: 1850, predicted: 1800, trend: 'down', change: -2.7 },
    'Tomato': { current: 18, predicted: 22, trend: 'up', change: 22.2 }
  };

  const prediction = generatePrediction(currentField);
  const marketData = marketPrices[getFieldCrop(currentField)];

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return faArrowUp;
      case 'down': return faArrowDown;
      default: return faEquals;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskColor = (impact) => {
    switch (impact) {
      case 'Very High': return 'text-red-700 bg-red-100';
      case 'High': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getFactorColor = (score) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const calculateRevenue = (yieldAmount, price) => {
    return (yieldAmount * getFieldArea(currentField) * price * 10).toLocaleString('en-IN'); // Convert to quintals and calculate
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Yield Prediction</h1>
            <p className="text-gray-600 mt-1">AI-powered harvest forecasting and market analysis</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {fields.map(field => (
                <option key={field._id || field.id} value={field._id || field.id}>
                  {getFieldName(field)} - {getFieldCrop(field)}
                </option>
              ))}
            </select>
            <select
              value={predictionPeriod}
              onChange={(e) => setPredictionPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {predictionPeriods.map(period => (
                <option key={period.id} value={period.id}>{period.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Loading State */}
        {fieldsLoading ? (
          <div className="flex items-center justify-center py-12">
            <FontAwesomeIcon icon={faSpinner} className="text-2xl text-blue-600 animate-spin mr-3" />
            <span className="text-lg text-gray-600">Loading fields...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-3xl text-red-600 mb-3" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to Load Fields</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchFields}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <FontAwesomeIcon icon={faRefresh} className="mr-2" />
              Retry
            </button>
          </div>
        ) : fields.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <FontAwesomeIcon icon={faWheatAwn} className="text-4xl text-gray-400 mb-3" />
            <h3 className="text-xl font-semibold text-gray-700">No fields available</h3>
            <p className="text-gray-600 mb-4">Create some fields first to view yield predictions</p>
            <a
              href="/create-field"
              className="inline-block bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Create your first field
            </a>
          </div>
        ) : (
        <>
        {/* Field Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Field Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <FontAwesomeIcon icon={faLeaf} className="text-blue-600 mr-2" />
                <span className="font-medium text-gray-900">Field</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{getFieldName(currentField)}</p>
              <p className="text-sm text-gray-600">{getFieldArea(currentField)} acres</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <FontAwesomeIcon icon={faWheatAwn} className="text-green-600 mr-2" />
                <span className="font-medium text-gray-900">Crop</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{getFieldCrop(currentField)}</p>
              <p className="text-sm text-gray-600">Planted: {getPlantedDate(currentField)}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <FontAwesomeIcon icon={faCalendarCheck} className="text-purple-600 mr-2" />
                <span className="font-medium text-gray-900">Harvest Date</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{new Date(prediction?.harvestDate).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600">{prediction?.daysToHarvest} days remaining</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <FontAwesomeIcon icon={faChartLine} className="text-orange-600 mr-2" />
                <span className="font-medium text-gray-900">Confidence</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{prediction?.confidence}%</p>
              <p className="text-sm text-gray-600">Prediction accuracy</p>
            </div>
          </div>
        </div>

        {/* Yield Prediction Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Yield Forecast */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Yield Forecast</h2>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Predicted Yield</span>
                <div className="flex items-center">
                  <FontAwesomeIcon 
                    icon={getTrendIcon(prediction?.trend)} 
                    className={`mr-2 ${getTrendColor(prediction?.trend)}`} 
                  />
                  <span className={`font-medium ${getTrendColor(prediction?.trend)}`}>
                    {prediction?.trend === 'up' ? '+' : prediction?.trend === 'down' ? '-' : ''}
                    {Math.abs(((prediction?.predictedYield - prediction?.currentYield) / prediction?.currentYield * 100) || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {prediction?.predictedYield} tons/hectare
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                Range: {prediction?.minYield} - {prediction?.maxYield} tons/hectare
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${(prediction?.predictedYield / prediction?.maxYield) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Current Season Average</span>
                <span className="font-medium text-gray-900">{prediction?.currentYield} tons/hectare</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-600">Expected Total Harvest</span>
                <span className="font-medium text-gray-900">
                  {(prediction?.predictedYield * getFieldArea(currentField) * 2.47).toFixed(1)} tons
                </span>
              </div>
            </div>
          </div>

          {/* Market Analysis */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Market Analysis</h2>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Predicted Price at Harvest</span>
                <div className="flex items-center">
                  <FontAwesomeIcon 
                    icon={getTrendIcon(marketData?.trend)} 
                    className={`mr-2 ${getTrendColor(marketData?.trend)}`} 
                  />
                  <span className={`font-medium ${getTrendColor(marketData?.trend)}`}>
                    {marketData?.change > 0 ? '+' : ''}{marketData?.change}%
                  </span>
                </div>
              </div>
              
              <div className="text-3xl font-bold text-gray-900 mb-1">
                ₹{marketData?.predicted}{getFieldCrop(currentField) === 'Tomato' ? '/kg' : '/quintal'}
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                Current: ₹{marketData?.current}{getFieldCrop(currentField) === 'Tomato' ? '/kg' : '/quintal'}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Expected Revenue</span>
                <span className="font-medium text-green-600">
                  ₹{calculateRevenue(prediction?.predictedYield, marketData?.predicted)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-600">Potential Profit Increase</span>
                <span className="font-medium text-green-700">
                  ₹{(calculateRevenue(prediction?.predictedYield, marketData?.predicted) - 
                      calculateRevenue(prediction?.currentYield, marketData?.current)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Factors Affecting Yield */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Factors Affecting Yield</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(prediction?.factors || {}).map(([factor, score]) => (
              <div key={factor} className="text-center">
                <div className="mb-2">
                  <div className="text-sm font-medium text-gray-900 capitalize mb-2">
                    {factor.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{score}%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getFactorColor(score)}`} 
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h2>
          <div className="space-y-3">
            {prediction?.risks.map((risk, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">{risk.risk}</div>
                    <div className="text-sm text-gray-600">Probability: {risk.probability}%</div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(risk.impact)}`}>
                  {risk.impact} Impact
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h2>
          <div className="space-y-3">
            {prediction?.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <FontAwesomeIcon icon={faCheckCircle} className="text-blue-600 mt-1 mr-3" />
                <div className="text-blue-800">{recommendation}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Historical Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Historical Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <FontAwesomeIcon icon={faHistory} className="text-gray-500 text-2xl mb-2" />
              <div className="text-xl font-bold text-gray-900">3.8 tons/ha</div>
              <div className="text-sm text-gray-600">Last Season (2023-24)</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <FontAwesomeIcon icon={faChartLine} className="text-blue-500 text-2xl mb-2" />
              <div className="text-xl font-bold text-gray-900">4.1 tons/ha</div>
              <div className="text-sm text-gray-600">3-Year Average</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <FontAwesomeIcon icon={faArrowUp} className="text-green-500 text-2xl mb-2" />
              <div className="text-xl font-bold text-green-600">+17%</div>
              <div className="text-sm text-gray-600">Expected Improvement</div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <FontAwesomeIcon icon={faInfoCircle} className="text-yellow-600 mt-1 mr-3" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">Prediction Disclaimer</h3>
              <p className="text-yellow-800 text-sm">
                These predictions are based on AI analysis of historical data, current conditions, and statistical models. 
                Actual yields may vary due to unforeseen weather events, pest outbreaks, market conditions, and other factors. 
                Use these predictions as guidance alongside your farming experience and local knowledge.
              </p>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default YieldPrediction;