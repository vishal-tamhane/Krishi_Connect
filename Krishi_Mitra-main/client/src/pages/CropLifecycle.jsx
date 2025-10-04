import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSeedling, 
  faLeaf, 
  faStar, 
  faWheatAwn,
  faCheckCircle,
  faClockRotateLeft,
  faCalendarAlt,
  faThermometerHalf,
  faDroplet,
  faEye,
  faPlus,
  faSpinner,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { API_URLS } from '../config.js';
import { getUserFields } from '../services/dataService';

const CropLifecycle = () => {
  const [selectedField, setSelectedField] = useState('');
  const [showPredictionForm, setShowPredictionForm] = useState(false);
  const [cropName, setCropName] = useState('');
  const [sowingDate, setSowingDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState('');
  const [fields, setFields] = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  
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
          area: field.area ? `${field.area} hectares` : 'Unknown area'
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
  


  const lifecycleStages = [
    {
      id: 1,
      name: 'Germination',
      icon: faSeedling,
      status: 'completed',
      progress: 100,
      duration: '7-14 days',
      startDate: '2025-01-15',
      endDate: '2025-01-29',
      description: 'Seeds sprouting and initial root development',
      requirements: ['Adequate moisture', 'Temperature 15-20°C', 'Proper soil depth'],
      actions: ['Daily watering', 'Monitor soil temperature', 'Check for pests']
    },
    {
      id: 2,
      name: 'Vegetative Growth',
      icon: faLeaf,
      status: 'completed',
      progress: 100,
      duration: '30-45 days',
      startDate: '2025-01-30',
      endDate: '2025-03-15',
      description: 'Leaf and stem development, root system expansion',
      requirements: ['Regular watering', 'Nitrogen fertilizer', 'Sunlight 6-8 hours'],
      actions: ['Fertilizer application', 'Weed control', 'Irrigation management']
    },
    {
      id: 3,
      name: 'Flowering',
      icon: faStar,
      status: 'active',
      progress: 65,
      duration: '20-30 days',
      startDate: '2025-03-16',
      endDate: '2025-04-05',
      description: 'Flower formation and pollination phase',
      requirements: ['Consistent moisture', 'Phosphorus fertilizer', 'Pest monitoring'],
      actions: ['Reduce nitrogen', 'Monitor for diseases', 'Ensure pollination']
    },
    {
      id: 4,
      name: 'Grain Filling',
      icon: faWheatAwn,
      status: 'upcoming',
      progress: 0,
      duration: '25-35 days',
      startDate: '2025-04-06',
      endDate: '2025-05-10',
      description: 'Grain development and maturation',
      requirements: ['Adequate water', 'Potassium fertilizer', 'Disease prevention'],
      actions: ['Monitor grain development', 'Disease control', 'Prepare for harvest']
    },
    {
      id: 5,
      name: 'Maturation',
      icon: faCheckCircle,
      status: 'upcoming',
      progress: 0,
      duration: '10-15 days',
      startDate: '2025-05-11',
      endDate: '2025-05-25',
      description: 'Final ripening and harvest readiness',
      requirements: ['Reduced watering', 'Dry weather', 'Harvest preparation'],
      actions: ['Stop irrigation', 'Monitor moisture content', 'Schedule harvest']
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-700 bg-green-100';
      case 'active': return 'text-amber-700 bg-amber-100';
      case 'upcoming': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-600';
      case 'active': return 'bg-amber-500';
      case 'upcoming': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  const handlePredictCrop = async () => {
    if (!cropName || !sowingDate) {
      setError('Please enter both crop name and sowing date');
      return;
    }

    if (!cropName.trim()) {
      setError('Please enter a valid crop name');
      return;
    }

    setIsLoading(true);
    setError('');

    const requestData = {
      crop_type: cropName.trim(),
      sowing_date: sowingDate
    };

    console.log('Sending crop prediction request:', requestData);

    try {
      const response = await fetch(API_URLS.CROP_CYCLE_PREDICTION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Server error: ${response.status}`;
        console.error('Crop prediction API error:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Crop prediction result:', result);
      setPredictionResult(result);
      setShowPredictionForm(false);
    } catch (err) {
      console.error('Crop prediction error:', err);
      setError('Error getting crop prediction: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const currentField = fields.find(f => f.id === selectedField);
  const activeStage = lifecycleStages.find(stage => stage.status === 'active');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Crop Lifecycle Tracking</h1>
            <p className="text-gray-600 mt-1">Monitor and manage crop growth stages</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {fields.map(field => (
                <option key={field.id} value={field.id}>{field.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Loading State */}
        {fieldsLoading ? (
          <div className="flex items-center justify-center py-12">
            <FontAwesomeIcon icon={faSpinner} className="text-2xl text-green-600 animate-spin mr-3" />
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
              Retry
            </button>
          </div>
        ) : fields.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <FontAwesomeIcon icon={faSeedling} className="text-4xl text-gray-400 mb-3" />
            <h3 className="text-xl font-semibold text-gray-700">No fields available</h3>
            <p className="text-gray-600 mb-4">Create some fields first to track crop lifecycle</p>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Field Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <FontAwesomeIcon icon={faLeaf} className="text-green-700 mr-2" />
                <span className="font-medium text-gray-900">Field Name</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{currentField?.name}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <FontAwesomeIcon icon={faSeedling} className="text-emerald-700 mr-2" />
                <span className="font-medium text-gray-900">Crop Type</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{currentField?.crop}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <FontAwesomeIcon icon={faWheatAwn} className="text-amber-700 mr-2" />
                <span className="font-medium text-gray-900">Field Area</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{currentField?.area}</p>
            </div>
          </div>
        </div>

        {/* Crop Prediction Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Crop Lifecycle Prediction</h2>
            <button
              onClick={() => setShowPredictionForm(!showPredictionForm)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Add New Crop
            </button>
          </div>

          {showPredictionForm && (
            <div className="border-t pt-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Crop Name
                  </label>
                  <input
                    type="text"
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    placeholder="Enter crop name (e.g., Maize, Cotton, Wheat)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sowing Date
                  </label>
                  <input
                    type="date"
                    value={sowingDate}
                    onChange={(e) => setSowingDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end mt-6 space-x-3">
                <button
                  onClick={() => {
                    setShowPredictionForm(false);
                    setCropName('');
                    setSowingDate('');
                    setError('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePredictCrop}
                  disabled={isLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? 'Predicting...' : 'Predict Lifecycle'}
                </button>
              </div>
            </div>
          )}

          {predictionResult && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Prediction Results</h3>
              <div className="bg-green-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Crop</p>
                    <p className="text-lg font-bold text-gray-900">{predictionResult.crop}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Harvest Date</p>
                    <p className="text-lg font-bold text-gray-900">{predictionResult.harvest_date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Duration</p>
                    <p className="text-lg font-bold text-gray-900">{predictionResult.total_duration} days</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Growth Timeline</h4>
                  <div className="space-y-3">
                    {predictionResult.timeline?.map((stage, index) => (
                      <div key={index} className="bg-white border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{stage.Stage}</p>
                            <p className="text-sm text-gray-600">{stage.Start} to {stage.End}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{stage.Duration_Days} days</p>
                            <p className="text-xs text-green-700">{stage.Irrigation_Need}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Weekly Irrigation Schedule</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {predictionResult.irrigation_schedule?.map((week, index) => (
                      <div key={index} className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{week.Week_Start}</p>
                            <p className="text-xs text-gray-600">{week.Stage}</p>
                          </div>
                          <p className="text-sm font-medium text-cyan-700">{week.Irrigation_Need}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current Stage Overview */}
        {activeStage && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Stage</h2>
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mr-4">
                    <FontAwesomeIcon icon={activeStage.icon} className="text-white text-lg" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{activeStage.name}</h3>
                    <p className="text-gray-600">{activeStage.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-700">{activeStage.progress}%</div>
                  <div className="text-sm text-gray-500">Complete</div>
                </div>
              </div>
              
              <div className="w-full bg-green-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-green-600 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${activeStage.progress}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
                  <ul className="space-y-1">
                    {activeStage.requirements.map((req, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-700">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-2 text-xs" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Recommended Actions</h4>
                  <ul className="space-y-1">
                    {activeStage.actions.map((action, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-700">
                        <FontAwesomeIcon icon={faClockRotateLeft} className="text-blue-500 mr-2 text-xs" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lifecycle Timeline */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Growth Timeline</h2>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-8">
              {lifecycleStages.map((stage, index) => (
                <div key={stage.id} className="relative flex items-start">
                  {/* Timeline dot */}
                  <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center ${getStatusColor(stage.status)} border-4 border-white shadow-lg`}>
                    <FontAwesomeIcon icon={stage.icon} className="text-xl" />
                  </div>
                  
                  {/* Content */}
                  <div className="ml-6 flex-1">
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{stage.name}</h3>
                          <p className="text-gray-600 mt-1">{stage.description}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(stage.status)}`}>
                            {stage.status.charAt(0).toUpperCase() + stage.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                          Duration: {stage.duration}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                          {new Date(stage.startDate).toLocaleDateString()} - {new Date(stage.endDate).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {stage.status !== 'upcoming' && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{stage.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(stage.status)}`} 
                              style={{ width: `${stage.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                          <ul className="space-y-1">
                            {stage.requirements.slice(0, 2).map((req, reqIndex) => (
                              <li key={reqIndex} className="text-sm text-gray-600">• {req}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Actions</h4>
                          <ul className="space-y-1">
                            {stage.actions.slice(0, 2).map((action, actionIndex) => (
                              <li key={actionIndex} className="text-sm text-gray-600">• {action}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Environmental Conditions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Environmental Conditions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <FontAwesomeIcon icon={faThermometerHalf} className="text-2xl text-red-500 mb-2" />
              <div className="text-2xl font-bold text-gray-900">22°C</div>
              <div className="text-sm text-gray-600">Temperature</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <FontAwesomeIcon icon={faDroplet} className="text-2xl text-blue-500 mb-2" />
              <div className="text-2xl font-bold text-gray-900">68%</div>
              <div className="text-sm text-gray-600">Humidity</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <FontAwesomeIcon icon={faLeaf} className="text-2xl text-green-500 mb-2" />
              <div className="text-2xl font-bold text-gray-900">0.72</div>
              <div className="text-sm text-gray-600">NDVI Score</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <FontAwesomeIcon icon={faEye} className="text-2xl text-yellow-500 mb-2" />
              <div className="text-2xl font-bold text-gray-900">Good</div>
              <div className="text-sm text-gray-600">Visibility</div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default CropLifecycle;