import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus,
  faSeedling,
  faChartLine,
  faCalendarAlt,
  faArrowRight,
  faMapMarkedAlt,
  faClockRotateLeft,
  faArrowUp,
  faWheatAwn,
  faCalendarCheck
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [recentFields] = useState([
    { id: 1, name: 'North Field', crop: 'Wheat', stage: 'Flowering', progress: 75 },
    { id: 2, name: 'South Field', crop: 'Rice', stage: 'Maturation', progress: 90 },
    { id: 3, name: 'East Field', crop: 'Corn', stage: 'Vegetative', progress: 45 }
  ]);

  const [cropPredictions] = useState([
    { crop: 'Wheat', confidence: 92, recommendedAction: 'Plant in 2 weeks', optimalSeason: 'Winter' },
    { crop: 'Rice', confidence: 88, recommendedAction: 'Wait for monsoon', optimalSeason: 'Kharif' },
    { crop: 'Corn', confidence: 85, recommendedAction: 'Plant after harvest', optimalSeason: 'Summer' }
  ]);

  const [yieldPredictions] = useState([
    { field: 'North Field', crop: 'Wheat', predictedYield: '4.2 tons', harvestDate: '2025-04-15', confidence: 89 },
    { field: 'South Field', crop: 'Rice', predictedYield: '6.8 tons', harvestDate: '2025-11-20', confidence: 94 },
    { field: 'East Field', crop: 'Corn', predictedYield: '5.5 tons', harvestDate: '2025-07-10', confidence: 87 }
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Farm Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage your fields and track crop performance</p>
      </div>

      <div className="px-6 space-y-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/create-field"
              className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <FontAwesomeIcon icon={faPlus} className="text-white" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Create New Field</h3>
                <p className="text-sm text-gray-600">Add a new field to your farm</p>
              </div>
              <FontAwesomeIcon icon={faArrowRight} className="ml-auto text-blue-500 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/crop-lifecycle"
              className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <FontAwesomeIcon icon={faSeedling} className="text-white" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Crop Lifecycle</h3>
                <p className="text-sm text-gray-600">Track crop growth stages</p>
              </div>
              <FontAwesomeIcon icon={faArrowRight} className="ml-auto text-green-500 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/crop-prediction"
              className="flex items-center p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                <FontAwesomeIcon icon={faChartLine} className="text-white" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Crop Prediction</h3>
                <p className="text-sm text-gray-600">AI-powered crop suggestions</p>
              </div>
              <FontAwesomeIcon icon={faArrowRight} className="ml-auto text-purple-500 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/yield-prediction"
              className="flex items-center p-4 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                <FontAwesomeIcon icon={faWheatAwn} className="text-white" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Yield Prediction</h3>
                <p className="text-sm text-gray-600">Predict harvest amounts</p>
              </div>
              <FontAwesomeIcon icon={faArrowRight} className="ml-auto text-orange-500 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Field Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Fields</h2>
            <Link to="/create-field" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              + Add New Field
            </Link>
          </div>
          
          {recentFields.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentFields.map((field) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{field.name}</h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{field.crop}</span>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Growth Stage: {field.stage}</span>
                      <span>{field.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${field.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <Link 
                    to="/crop-lifecycle" 
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FontAwesomeIcon icon={faMapMarkedAlt} className="text-4xl mb-3 text-gray-300" />
              <p>No fields created yet</p>
              <Link to="/create-field" className="text-blue-600 hover:text-blue-700 font-medium">
                Create your first field
              </Link>
            </div>
          )}
        </div>

        {/* Crop Predictions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">AI Crop Recommendations</h2>
            <Link to="/crop-prediction" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
              View All →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cropPredictions.map((prediction, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{prediction.crop}</h3>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    {prediction.confidence}% confidence
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{prediction.recommendedAction}</p>
                <div className="text-xs text-gray-500">
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
                  Best for: {prediction.optimalSeason}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Yield Predictions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Yield Predictions</h2>
            <Link to="/yield-prediction" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
              View Details →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {yieldPredictions.map((prediction, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{prediction.field}</h3>
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    {prediction.confidence}% accuracy
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Crop:</span>
                    <span className="font-medium">{prediction.crop}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Predicted Yield:</span>
                    <span className="font-medium text-green-600">{prediction.predictedYield}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Harvest Date:</span>
                    <span className="font-medium">{new Date(prediction.harvestDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
