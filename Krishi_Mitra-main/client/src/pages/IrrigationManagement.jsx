import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDroplet,
  faPlay,
  faStop,
  faBatteryFull,
  faBatteryHalf,
  faBatteryQuarter,
  faCloudRain,
  faSun,
  faCloud,
  faCloudShowersHeavy,
  faTemperatureHigh,
  faWind,
  faEye,
  faSpinner,
  faCheckCircle,
  faTimesCircle,
  faExclamationTriangle,
  faCalendarCheck,
  faClock,
  faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';
import { getUserFields } from '../services/dataService';

const IrrigationManagement = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waterTankLevel, setWaterTankLevel] = useState(75); // Percentage
  const [pumps, setPumps] = useState({
    north: { status: 'idle', fieldId: null, duration: 0 },
    south: { status: 'running', fieldId: 'field-1', duration: 45 },
    east: { status: 'idle', fieldId: null, duration: 0 },
    west: { status: 'maintenance', fieldId: null, duration: 0 }
  });
  const [weatherData, setWeatherData] = useState({
    temperature: 28,
    humidity: 65,
    windSpeed: 12,
    condition: 'sunny',
    rainProbability: 15,
    forecast: '3 days clear'
  });
  const [irrigationSchedule, setIrrigationSchedule] = useState([]);
  const [activeField, setActiveField] = useState(null);

  useEffect(() => {
    fetchFields();
    fetchIrrigationSchedule();
    // Simulate real-time updates
    const interval = setInterval(() => {
      updatePumpDurations();
      updateWeatherData();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchFields = async () => {
    try {
      const result = await getUserFields();
      if (result.success && Array.isArray(result.data)) {
        const mappedFields = result.data.map(field => ({
          id: field._id,
          name: field.field_name,
          area: field.area || 0,
          cropType: field.current_crop || 'Not specified',
          soilType: field.soil_type || 'Unknown',
          lastIrrigation: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          nextIrrigation: new Date(Date.now() + Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
          irrigationStatus: Math.random() > 0.7 ? 'active' : 'scheduled',
          waterRequirement: Math.floor(field.area * 150 + Math.random() * 100) // liters per day
        }));
        setFields(mappedFields);
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIrrigationSchedule = () => {
    // Simulate irrigation schedule data
    const schedule = [
      {
        id: 1,
        fieldName: 'North Field',
        scheduledTime: '06:00 AM',
        duration: '30 min',
        status: 'completed',
        waterAmount: '500L'
      },
      {
        id: 2,
        fieldName: 'South Field',
        scheduledTime: '07:00 AM',
        duration: '45 min',
        status: 'active',
        waterAmount: '750L'
      },
      {
        id: 3,
        fieldName: 'East Field',
        scheduledTime: '08:30 AM',
        duration: '35 min',
        status: 'pending',
        waterAmount: '600L'
      },
      {
        id: 4,
        fieldName: 'West Field',
        scheduledTime: '10:00 AM',
        duration: '40 min',
        status: 'delayed',
        waterAmount: '700L'
      }
    ];
    setIrrigationSchedule(schedule);
  };

  const updatePumpDurations = () => {
    setPumps(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(pumpId => {
        if (updated[pumpId].status === 'running') {
          updated[pumpId].duration += 0.5; // Add 30 seconds
        }
      });
      return updated;
    });
  };

  const updateWeatherData = () => {
    // Simulate weather updates
    setWeatherData(prev => ({
      ...prev,
      temperature: prev.temperature + (Math.random() - 0.5) * 2,
      humidity: Math.max(30, Math.min(90, prev.humidity + (Math.random() - 0.5) * 5)),
      windSpeed: Math.max(0, prev.windSpeed + (Math.random() - 0.5) * 3),
      rainProbability: Math.max(0, Math.min(100, prev.rainProbability + (Math.random() - 0.5) * 10))
    }));
  };

  const startPump = (pumpId, fieldId) => {
    if (waterTankLevel < 10) {
      alert('Water tank level too low! Please refill tank before starting irrigation.');
      return;
    }
    
    setPumps(prev => ({
      ...prev,
      [pumpId]: {
        status: 'running',
        fieldId: fieldId,
        duration: 0
      }
    }));
    
    // Simulate water consumption
    const interval = setInterval(() => {
      setWaterTankLevel(prev => Math.max(0, prev - 0.5));
    }, 60000); // Decrease 0.5% per minute
    
    setTimeout(() => clearInterval(interval), 3600000); // Stop after 1 hour
  };

  const stopPump = (pumpId) => {
    setPumps(prev => ({
      ...prev,
      [pumpId]: {
        status: 'idle',
        fieldId: null,
        duration: 0
      }
    }));
  };

  const getPumpIcon = (status) => {
    switch (status) {
      case 'running': return faPlay;
      case 'maintenance': return faExclamationTriangle;
      default: return faStop;
    }
  };

  const getPumpColor = (status) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getWaterLevelIcon = (level) => {
    if (level > 66) return faBatteryFull;
    if (level > 33) return faBatteryHalf;
    return faBatteryQuarter;
  };

  const getWaterLevelColor = (level) => {
    if (level > 66) return 'text-blue-600';
    if (level > 33) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'sunny': return faSun;
      case 'cloudy': return faCloud;
      case 'rainy': return faCloudRain;
      case 'stormy': return faCloudShowersHeavy;
      default: return faCloud;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return faCheckCircle;
      case 'active': return faSpinner;
      case 'delayed': return faExclamationTriangle;
      default: return faClock;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'delayed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-blue-600 mb-4" />
          <p className="text-gray-600">Loading irrigation system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FontAwesomeIcon icon={faDroplet} className="mr-3 text-blue-600" />
                Irrigation Management
              </h1>
              <p className="text-gray-600 mt-1">Monitor and control field irrigation systems</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <span className="text-sm text-blue-600 font-medium">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Water Tank Level */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Water Tank</h3>
              <FontAwesomeIcon 
                icon={getWaterLevelIcon(waterTankLevel)} 
                className={`text-2xl ${getWaterLevelColor(waterTankLevel)}`} 
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Level</span>
                <span className="font-bold text-xl">{waterTankLevel.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    waterTankLevel > 66 ? 'bg-blue-600' : 
                    waterTankLevel > 33 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${waterTankLevel}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500">
                Capacity: 10,000L • Available: {((waterTankLevel/100) * 10000).toFixed(0)}L
              </div>
            </div>
          </div>

          {/* Weather Conditions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Weather</h3>
              <FontAwesomeIcon 
                icon={getWeatherIcon(weatherData.condition)} 
                className="text-2xl text-yellow-500" 
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Temperature</span>
                <span className="font-medium">{weatherData.temperature.toFixed(1)}°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Humidity</span>
                <span className="font-medium">{weatherData.humidity.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Rain Chance</span>
                <span className="font-medium">{weatherData.rainProbability.toFixed(0)}%</span>
              </div>
              {weatherData.rainProbability > 70 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-3">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faCloudRain} className="text-blue-600 mr-2" />
                    <span className="text-xs text-blue-800">Rain expected - irrigation may be delayed</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Pumps */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Active Pumps</h3>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm text-green-600">1 Running</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">South Pump</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium">{pumps.south.duration.toFixed(0)} min</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Other Pumps</span>
                <span className="text-sm text-gray-500">Idle</span>
              </div>
              <div className="text-xs text-gray-500 mt-3">
                Total runtime today: 2h 15min
              </div>
            </div>
          </div>

          {/* Today's Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Today's Summary</h3>
              <FontAwesomeIcon icon={faCalendarCheck} className="text-2xl text-green-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Water Used</span>
                <span className="font-medium">2,150L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Fields Irrigated</span>
                <span className="font-medium">3 of 4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Scheduled</span>
                <span className="font-medium">4 sessions</span>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-3">
                <span className="text-xs text-green-800">75% completion rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Pump Control System */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Pump Control System</h3>
                <p className="text-sm text-gray-600">Control irrigation pumps for different field zones</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(pumps).map(([pumpId, pump]) => (
                    <div 
                      key={pumpId}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getPumpColor(pump.status)}`}>
                            <FontAwesomeIcon icon={getPumpIcon(pump.status)} className="text-sm" />
                          </div>
                          <div className="ml-3">
                            <h4 className="font-medium text-gray-900 capitalize">{pumpId} Pump</h4>
                            <p className="text-sm text-gray-600 capitalize">{pump.status}</p>
                          </div>
                        </div>
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400" />
                      </div>
                      
                      {pump.status === 'running' && (
                        <div className="bg-blue-50 rounded-lg p-3 mb-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-blue-900">Running Time</span>
                            <span className="text-sm text-blue-700">{pump.duration.toFixed(0)} minutes</span>
                          </div>
                          <div className="w-full bg-blue-200 rounded-full h-2">
                            <div 
                              className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, (pump.duration / 60) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        {pump.status === 'idle' && (
                          <button
                            onClick={() => {
                              const fieldId = fields[Math.floor(Math.random() * fields.length)]?.id;
                              startPump(pumpId, fieldId);
                            }}
                            className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                          >
                            <FontAwesomeIcon icon={faPlay} className="mr-2" />
                            Start
                          </button>
                        )}
                        {pump.status === 'running' && (
                          <button
                            onClick={() => stopPump(pumpId)}
                            className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
                          >
                            <FontAwesomeIcon icon={faStop} className="mr-2" />
                            Stop
                          </button>
                        )}
                        {pump.status === 'maintenance' && (
                          <button
                            disabled
                            className="flex-1 bg-gray-300 text-gray-500 px-3 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
                          >
                            Under Maintenance
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Irrigation Schedule */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
              <p className="text-sm text-gray-600">Planned irrigation sessions</p>
            </div>
            <div className="p-6 space-y-4">
              {irrigationSchedule.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(item.status)}`}>
                      <FontAwesomeIcon 
                        icon={getStatusIcon(item.status)} 
                        className={`text-sm ${item.status === 'active' ? 'animate-spin' : ''}`} 
                      />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{item.fieldName}</p>
                      <p className="text-xs text-gray-600">{item.scheduledTime} • {item.duration}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{item.waterAmount}</p>
                    <p className="text-xs text-gray-600 capitalize">{item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Field Status Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Field Irrigation Status</h3>
            <p className="text-sm text-gray-600">Monitor water requirements and schedules for all fields</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Field Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Crop Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Area (ha)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Water Req. (L/day)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Irrigation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Irrigation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fields.map((field) => (
                  <tr key={field.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{field.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {field.cropType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {field.area.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {field.waterRequirement}L
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(field.lastIrrigation).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(field.nextIrrigation).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        field.irrigationStatus === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {field.irrigationStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setActiveField(field.id)}
                        className="text-blue-600 hover:text-blue-700 font-medium mr-3"
                      >
                        <FontAwesomeIcon icon={faEye} className="mr-1" />
                        View
                      </button>
                      <button className="text-green-600 hover:text-green-700 font-medium">
                        <FontAwesomeIcon icon={faPlay} className="mr-1" />
                        Start
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IrrigationManagement;