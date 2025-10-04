import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCloudSunRain,
  faCalendarAlt,
  faFilter,
  faDownload,
  faLocationDot,
  faInfoCircle,
  faTemperatureHigh,
  faWater,
  faWind,
  faSun,
  faChartLine,
  faCloud,
  faThermometerHalf,
  faRainbow,
  faTriangleExclamation,
  faLeaf
} from '@fortawesome/free-solid-svg-icons';
import { Line, Bar } from 'react-chartjs-2';
import { useAppContext } from '../../context/AppContext';
import { fetchWeatherData } from '../../services/climateService';

const WeatherAnalysis = ({ dateRange, onDateRangeChange, showDateRangePicker, setShowDateRangePicker }) => {
  const { selectedField, selectedLocation } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState({
    temperature: [],
    humidity: [],
    rainfall: []
  });
  
  // Add refs for chart instances to properly clean up
  const temperatureChartRef = useRef(null);
  const rainfallChartRef = useRef(null);
  const temperatureForecastRef = useRef(null);
  const humidityChartRef = useRef(null);
  
  // Weather impacts on crops
  const [weatherImpacts, setWeatherImpacts] = useState({
    temperature: {
      status: 'optimal',
      impact: 'Current temperatures are optimal for crop growth and development.',
      recommendation: 'Continue monitoring for any sudden changes. No action required at this time.'
    },
    humidity: {
      status: 'moderate',
      impact: 'Current humidity levels are within acceptable ranges for most crops.',
      recommendation: 'Monitor for signs of fungal disease if humidity remains high for extended periods.'
    },
    rainfall: {
      status: 'low',
      impact: 'Rainfall is below optimal levels for the current growth stage.',
      recommendation: 'Consider supplemental irrigation within the next 3-5 days if no significant rainfall occurs.'
    }
  });
  
  // Weather alerts
  const [weatherAlerts, setWeatherAlerts] = useState([
    {
      type: 'warning',
      title: 'Heat Stress Warning',
      message: 'Temperatures forecasted to exceed 35°C on May 15-16. Consider additional irrigation to prevent crop stress.',
      date: '2025-05-12'
    },
    {
      type: 'info',
      title: 'Optimal Planting Period',
      message: 'Based on temperature and rainfall forecasts, next week (May 17-24) will be optimal for planting summer crops.',
      date: '2025-05-12'
    }
  ]);
  
  useEffect(() => {
    loadWeatherData();
    
    // Cleanup function to destroy chart instances when unmounting
    return () => {
      if (temperatureChartRef.current) {
        temperatureChartRef.current.destroy();
      }
      if (rainfallChartRef.current) {
        rainfallChartRef.current.destroy();
      }
      if (temperatureForecastRef.current) {
        temperatureForecastRef.current.destroy();
      }
      if (humidityChartRef.current) {
        humidityChartRef.current.destroy();
      }
    };
  }, [selectedField, selectedLocation, dateRange]);
  
  const loadWeatherData = async () => {
    setLoading(true);
    try {
      const data = await fetchWeatherData(
        selectedField, 
        selectedLocation, 
        dateRange
      );
      setWeatherData(data);
      
      // Update weather impacts based on loaded data
      if (data.temperature?.length > 0) {
        const latestTemp = data.temperature[data.temperature.length - 1].value;
        const tempImpact = latestTemp > 32 ? {
          status: 'high',
          impact: 'Current temperatures may cause heat stress for some crops.',
          recommendation: 'Consider additional irrigation and shade for sensitive crops.'
        } : latestTemp < 15 ? {
          status: 'low',
          impact: 'Current temperatures are below optimal for active growth.',
          recommendation: 'Monitor for cold stress. Consider delayed planting for temperature-sensitive crops.'
        } : {
          status: 'optimal',
          impact: 'Current temperatures are optimal for crop growth and development.',
          recommendation: 'Maintain normal management practices.'
        };
        
        setWeatherImpacts(prev => ({
          ...prev,
          temperature: tempImpact
        }));
      }
      
      if (data.humidity?.length > 0) {
        const latestHumidity = data.humidity[data.humidity.length - 1].value;
        const humidityImpact = latestHumidity > 80 ? {
          status: 'high',
          impact: 'High humidity levels increase risk of fungal diseases.',
          recommendation: 'Monitor crops closely for early signs of disease. Consider preventive fungicide application.'
        } : latestHumidity < 40 ? {
          status: 'low',
          impact: 'Low humidity may increase water stress.',
          recommendation: 'Increase irrigation frequency to compensate for higher evapotranspiration.'
        } : {
          status: 'moderate',
          impact: 'Current humidity levels are within acceptable ranges for most crops.',
          recommendation: 'Continue regular monitoring.'
        };
        
        setWeatherImpacts(prev => ({
          ...prev,
          humidity: humidityImpact
        }));
      }
      
      if (data.rainfall?.length > 0) {
        const totalRainfall = data.rainfall.reduce((sum, item) => sum + item.value, 0);
        const rainfallImpact = totalRainfall > 50 ? {
          status: 'high',
          impact: 'Recent rainfall exceeds optimal levels. Risk of waterlogging and root diseases.',
          recommendation: 'Check field drainage. Monitor low-lying areas for water accumulation.'
        } : totalRainfall < 15 ? {
          status: 'low',
          impact: 'Rainfall is below optimal levels for the current growth stage.',
          recommendation: 'Plan irrigation to supplement rainfall deficiency.'
        } : {
          status: 'moderate',
          impact: 'Current rainfall levels are adequate for crop needs.',
          recommendation: 'Continue monitoring forecast for planning irrigation.'
        };
        
        setWeatherImpacts(prev => ({
          ...prev,
          rainfall: rainfallImpact
        }));
      }
      
    } catch (error) {
      console.error('Error loading weather data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const applyDateRange = () => {
    loadWeatherData();
  };
  
  // Enhanced chart options with improved UI
  const getChartOptions = (title, customOptions = {}) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 11
          }
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255,255,255,0.9)',
        titleColor: '#333',
        bodyColor: '#666',
        titleFont: {
          weight: 'bold',
          size: 13
        },
        bodyFont: {
          size: 12
        },
        borderColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        cornerRadius: 4
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: customOptions.xAxisTitle || 'Date',
          font: {
            weight: 'bold',
            size: 12
          },
          padding: {
            top: 10
          }
        },
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.05)'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        title: {
          display: true,
          text: customOptions.yAxisTitle || 'Value',
          font: {
            weight: 'bold',
            size: 12
          },
          padding: {
            bottom: 10
          }
        },
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.05)'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    elements: {
      line: {
        borderWidth: 2
      },
      point: {
        hitRadius: 8,
        hoverRadius: 8
      }
    }
  });
  
  // Format date function for chart labels
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    } catch (e) {
      console.error('Invalid date:', dateString);
      return '';
    }
  };
  
  // Generate chart data for temperature
  const temperatureChartData = {
    labels: weatherData.temperature?.map(item => formatDate(item.date)) || [],
    datasets: [
      {
        label: 'Temperature (°C)',
        data: weatherData.temperature?.map(item => item.value) || [],
        fill: false,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.3,
        pointBackgroundColor: 'rgb(255, 99, 132)',
        pointBorderColor: 'white',
        pointBorderWidth: 1.5,
        pointRadius: 4
      },
      {
        label: 'Optimal Range',
        data: weatherData.temperature?.map(() => 25) || [], // Optimal temperature line
        borderColor: 'rgba(75, 192, 192, 0.8)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false
      }
    ]
  };
  
  // Generate chart data for rainfall
  const rainfallChartData = {
    labels: weatherData.rainfall?.map(item => formatDate(item.date)) || [],
    datasets: [
      {
        label: 'Rainfall (mm)',
        data: weatherData.rainfall?.map(item => item.value) || [],
        fill: true,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgb(54, 162, 235)',
        tension: 0.3,
        pointBackgroundColor: 'rgb(54, 162, 235)',
        pointBorderColor: 'white',
        pointBorderWidth: 1.5,
        pointRadius: 4
      }
    ]
  };
  
  // Generate chart data for humidity
  const humidityChartData = {
    labels: weatherData.humidity?.map(item => formatDate(item.date)) || [],
    datasets: [
      {
        label: 'Humidity (%)',
        data: weatherData.humidity?.map(item => item.value) || [],
        fill: true,
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgb(153, 102, 255)',
        tension: 0.3,
        pointBackgroundColor: 'rgb(153, 102, 255)',
        pointBorderColor: 'white',
        pointBorderWidth: 1.5,
        pointRadius: 4
      }
    ]
  };
  
  // Generate forecast temperature data
  const forecastData = {
    labels: ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5'],
    datasets: [
      {
        label: 'High',
        data: [32, 31, 28, 27, 30],
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        barThickness: 12,
        borderRadius: 4,
        borderColor: 'rgb(255, 99, 132)'
      },
      {
        label: 'Low',
        data: [24, 23, 21, 20, 22],
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        barThickness: 12,
        borderRadius: 4,
        borderColor: 'rgb(54, 162, 235)'
      }
    ]
  };
  
  // Helper function to get status color
  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'optimal':
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'low':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="Analytics">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <FontAwesomeIcon icon={faCloudSunRain} className="text-yellow-500 mr-2" />
          Weather Forecast and Analysis
        </h2>
        <p className="text-gray-600">
          Track temperature trends, rainfall patterns, and forecast for your farm.
        </p>
      </div>
      
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md text-sm">
          <FontAwesomeIcon icon={faLocationDot} className="mr-1" />
          <span className="font-medium">{selectedLocation || 'Default Location'}</span>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <button 
            className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors"
            onClick={() => setShowDateRangePicker(!showDateRangePicker)}
          >
            <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
            <span>Date Range</span>
          </button>
          <button className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors">
            <FontAwesomeIcon icon={faFilter} className="mr-1" />
            <span>Filter</span>
          </button>
          <button className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors">
            <FontAwesomeIcon icon={faDownload} className="mr-1" />
            <span>Export</span>
          </button>
        </div>
      </div>
      
      {showDateRangePicker && (
        <div className="bg-white shadow-md rounded-lg p-4 mb-4 border border-gray-200">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input 
                type="date" 
                id="startDate" 
                name="startDate"
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={dateRange.startDate}
                onChange={onDateRangeChange}
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input 
                type="date" 
                id="endDate" 
                name="endDate"
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={dateRange.endDate}
                onChange={onDateRangeChange}
              />
            </div>
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
              onClick={applyDateRange}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Apply'}
            </button>
          </div>
        </div>
      )}
      
      {/* Weather Alerts */}
      {weatherAlerts && weatherAlerts.length > 0 && (
        <div className="mb-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon={faTriangleExclamation} className="text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">{weatherAlerts[0].title}</h3>
                <div className="mt-1 text-sm text-yellow-700">
                  <p>{weatherAlerts[0].message}</p>
                </div>
                {weatherAlerts.length > 1 && (
                  <div className="mt-2 text-xs text-yellow-700">
                    <button className="font-medium hover:underline">
                      View {weatherAlerts.length - 1} more alert{weatherAlerts.length > 2 ? 's' : ''}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-10">
          <div className="spinner border-t-4 border-blue-500 border-solid rounded-full w-12 h-12 mx-auto mb-4 animate-spin"></div>
          <p className="text-gray-600">Loading weather data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Temperature Chart - Enhanced UI */}
          <div className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <FontAwesomeIcon icon={faTemperatureHigh} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold">Temperature Trends</h3>
            </div>
            
            <div className="h-80">
              <Line 
                data={temperatureChartData} 
                options={getChartOptions('Daily Temperature', {
                  yAxisTitle: 'Temperature (°C)'
                })} 
                ref={temperatureChartRef}
              />
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 border-l-4 border-gray-400 rounded-r">
              <div className="flex items-start">
                <FontAwesomeIcon icon={faInfoCircle} className="text-gray-500 mt-1 mr-2" />
                <div>
                  <h4 className="font-medium">Temperature Impact</h4>
                  <p className="text-sm text-gray-600">
                    {weatherImpacts.temperature.impact}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Rainfall Chart - Enhanced UI */}
          <div className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <FontAwesomeIcon icon={faWater} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Rainfall Patterns</h3>
            </div>
            
            <div className="h-80">
              <Line 
                data={rainfallChartData} 
                options={getChartOptions('Daily Rainfall', {
                  yAxisTitle: 'Rainfall (mm)'
                })} 
                ref={rainfallChartRef}
              />
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 border-l-4 border-gray-400 rounded-r">
              <div className="flex items-start">
                <FontAwesomeIcon icon={faInfoCircle} className="text-gray-500 mt-1 mr-2" />
                <div>
                  <h4 className="font-medium">Precipitation Insight</h4>
                  <p className="text-sm text-gray-600">
                    {weatherData.rainfall?.length > 0 ? 
                      `Total rainfall over this period: ${weatherData.rainfall.reduce((sum, item) => sum + item.value, 0).toFixed(1)} mm. ${weatherImpacts.rainfall.impact}` : 
                      'No rainfall data available for the selected period.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Humidity Chart - New */}
          <div className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <FontAwesomeIcon icon={faCloud} className="text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold">Humidity Levels</h3>
            </div>
            
            <div className="h-80">
              <Line 
                data={humidityChartData} 
                options={getChartOptions('Daily Humidity', {
                  yAxisTitle: 'Humidity (%)'
                })} 
                ref={humidityChartRef}
              />
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 border-l-4 border-gray-400 rounded-r">
              <div className="flex items-start">
                <FontAwesomeIcon icon={faInfoCircle} className="text-gray-500 mt-1 mr-2" />
                <div>
                  <h4 className="font-medium">Humidity Impact</h4>
                  <p className="text-sm text-gray-600">
                    {weatherImpacts.humidity.impact}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Temperature Forecast - New */}
          <div className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                <FontAwesomeIcon icon={faChartLine} className="text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold">Temperature Forecast</h3>
            </div>
            
            <div className="h-80">
              <Bar 
                data={forecastData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: '5-Day Temperature Forecast',
                      font: {
                        size: 16,
                        weight: 'bold'
                      }
                    }
                  },
                  scales: {
                    y: {
                      title: {
                        display: true,
                        text: 'Temperature (°C)',
                        font: {
                          weight: 'bold',
                          size: 12
                        }
                      }
                    }
                  }
                }} 
                ref={temperatureForecastRef}
              />
            </div>
          </div>
          
          {/* Weather Summary - Enhanced UI */}
          <div className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100 lg:col-span-2">
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-semibold">Weather Summary</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Temperature Summary */}
              <div className="bg-gradient-to-br from-red-50 to-white p-4 rounded-lg border border-red-100">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-2">
                    <FontAwesomeIcon icon={faTemperatureHigh} className="text-red-500" />
                  </div>
                  <div className="text-sm text-gray-600">Current Temperature</div>
                </div>
                <div className="text-3xl font-bold text-gray-800">
                  {weatherData.temperature?.length > 0 ? 
                    `${weatherData.temperature[weatherData.temperature.length - 1].value}°C` : 
                    'N/A'}
                </div>
                <div className="text-sm mt-2 flex items-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(weatherImpacts.temperature.status)}`}>
                    {weatherData.temperature?.length > 0 && weatherData.temperature[weatherData.temperature.length - 1].value > 30 ? 
                      'Above Average' : 'Normal Range'}
                  </span>
                </div>
              </div>
              
              {/* Humidity Summary */}
              <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-lg border border-purple-100">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                    <FontAwesomeIcon icon={faCloud} className="text-purple-500" />
                  </div>
                  <div className="text-sm text-gray-600">Humidity</div>
                </div>
                <div className="text-3xl font-bold text-gray-800">
                  {weatherData.humidity?.length > 0 ? 
                    `${weatherData.humidity[weatherData.humidity.length - 1].value}%` : 
                    'N/A'}
                </div>
                <div className="text-sm mt-2 flex items-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(weatherImpacts.humidity.status)}`}>
                    {weatherImpacts.humidity.status.charAt(0).toUpperCase() + weatherImpacts.humidity.status.slice(1)}
                  </span>
                </div>
              </div>
              
              {/* Rainfall Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg border border-blue-100">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                    <FontAwesomeIcon icon={faWater} className="text-blue-500" />
                  </div>
                  <div className="text-sm text-gray-600">Period Rainfall</div>
                </div>
                <div className="text-3xl font-bold text-gray-800">
                  {weatherData.rainfall?.length > 0 ? 
                    `${weatherData.rainfall.reduce((sum, item) => sum + item.value, 0).toFixed(1)}mm` : 
                    'N/A'}
                </div>
                <div className="text-sm mt-2 flex items-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(weatherImpacts.rainfall.status)}`}>
                    {weatherImpacts.rainfall.status.charAt(0).toUpperCase() + weatherImpacts.rainfall.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Weather Forecast - Enhanced UI */}
          <div className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100 lg:col-span-2">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                <FontAwesomeIcon icon={faSun} className="text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold">5-Day Forecast</h3>
            </div>
            
            <div className="grid grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                
                // Simulate different weather conditions
                const conditions = ['sunny', 'partly_cloudy', 'cloudy', 'rainy', 'sunny'];
                const temps = [32, 31, 28, 27, 30];
                const minTemps = [24, 23, 21, 20, 22];
                const precipChance = [10, 20, 60, 80, 20];
                
                return (
                  <div key={i} className="text-center p-4 border rounded-lg hover:shadow-sm transition-shadow bg-gradient-to-b from-white to-blue-50">
                    <div className="text-sm font-medium mb-2 bg-blue-100 py-1 px-2 rounded-full">
                      {date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-4xl text-center my-3">
                      {conditions[i] === 'sunny' && '☀️'}
                      {conditions[i] === 'partly_cloudy' && '⛅'}
                      {conditions[i] === 'cloudy' && '☁️'}
                      {conditions[i] === 'rainy' && '🌧️'}
                    </div>
                    <div className="font-bold text-xl text-gray-800">{temps[i]}°C</div>
                    <div className="text-xs text-gray-500 mb-2">{minTemps[i]}°C</div>
                    <div className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-1 inline-block">
                      {precipChance[i]}% precipitation
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 text-center">
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center mx-auto">
                View detailed forecast
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Weather Impact on Crops - New Section */}
          <div className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100 lg:col-span-2">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <FontAwesomeIcon icon={faLeaf} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Weather Impact on Crops</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg border ${
                weatherImpacts.temperature.status === 'high' ? 'bg-red-50 border-red-200' :
                weatherImpacts.temperature.status === 'low' ? 'bg-yellow-50 border-yellow-200' :
                'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-2">
                    <FontAwesomeIcon icon={faThermometerHalf} className={`${
                      weatherImpacts.temperature.status === 'high' ? 'text-red-500' :
                      weatherImpacts.temperature.status === 'low' ? 'text-yellow-500' :
                      'text-green-500'
                    }`} />
                  </div>
                  <h4 className="font-medium">Temperature Impact</h4>
                </div>
                <p className="text-sm text-gray-700 mb-2">{weatherImpacts.temperature.impact}</p>
                <div className="text-sm font-medium mt-2">
                  <span>Recommendation:</span>
                  <p className="text-gray-600">{weatherImpacts.temperature.recommendation}</p>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg border ${
                weatherImpacts.humidity.status === 'high' ? 'bg-red-50 border-red-200' :
                weatherImpacts.humidity.status === 'low' ? 'bg-yellow-50 border-yellow-200' :
                'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-2">
                    <FontAwesomeIcon icon={faCloud} className={`${
                      weatherImpacts.humidity.status === 'high' ? 'text-red-500' :
                      weatherImpacts.humidity.status === 'low' ? 'text-yellow-500' :
                      'text-green-500'
                    }`} />
                  </div>
                  <h4 className="font-medium">Humidity Impact</h4>
                </div>
                <p className="text-sm text-gray-700 mb-2">{weatherImpacts.humidity.impact}</p>
                <div className="text-sm font-medium mt-2">
                  <span>Recommendation:</span>
                  <p className="text-gray-600">{weatherImpacts.humidity.recommendation}</p>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg border ${
                weatherImpacts.rainfall.status === 'high' ? 'bg-red-50 border-red-200' :
                weatherImpacts.rainfall.status === 'low' ? 'bg-yellow-50 border-yellow-200' :
                'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mr-2">
                    <FontAwesomeIcon icon={faWater} className={`${
                      weatherImpacts.rainfall.status === 'high' ? 'text-red-500' :
                      weatherImpacts.rainfall.status === 'low' ? 'text-yellow-500' :
                      'text-green-500'
                    }`} />
                  </div>
                  <h4 className="font-medium">Rainfall Impact</h4>
                </div>
                <p className="text-sm text-gray-700 mb-2">{weatherImpacts.rainfall.impact}</p>
                <div className="text-sm font-medium mt-2">
                  <span>Recommendation:</span>
                  <p className="text-gray-600">{weatherImpacts.rainfall.recommendation}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h4 className="font-medium flex items-center mb-2">
                <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 mr-2" />
                Weather-based Farming Activities
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded shadow-sm flex items-start">
                  <div className="mt-1 mr-2 text-green-500">✓</div>
                  <div>
                    <h5 className="font-medium text-sm">Ideal for Planting</h5>
                    <p className="text-xs text-gray-600">Weather conditions are favorable for planting summer crops in the next 7 days.</p>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded shadow-sm flex items-start">
                  <div className="mt-1 mr-2 text-yellow-500">⚠</div>
                  <div>
                    <h5 className="font-medium text-sm">Irrigation Planning</h5>
                    <p className="text-xs text-gray-600">Schedule irrigation for May 15-17 due to forecasted dry conditions.</p>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded shadow-sm flex items-start">
                  <div className="mt-1 mr-2 text-red-500">⨯</div>
                  <div>
                    <h5 className="font-medium text-sm">Avoid Fertilizer Application</h5>
                    <p className="text-xs text-gray-600">Not recommended during expected rainfall on May 13.</p>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded shadow-sm flex items-start">
                  <div className="mt-1 mr-2 text-green-500">✓</div>
                  <div>
                    <h5 className="font-medium text-sm">Pest Monitoring</h5>
                    <p className="text-xs text-gray-600">High humidity periods (May 12-13) may increase disease pressure. Monitor closely.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherAnalysis;
