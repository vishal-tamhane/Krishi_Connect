import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCloudSunRain, 
  faDroplet, 
  faLeaf, 
  faFire, 
  faCloudRain, 
  faSeedling,
  faTriangleExclamation,
  faChartLine,
  faInfoCircle,
  faCalendarAlt,
  faFilter,
  faDownload,
  faLocationDot,
  faLayerGroup
} from '@fortawesome/free-solid-svg-icons';
import { useAppContext } from '../context/AppContext';
import { useLocation } from 'react-router-dom';

// Import Analysis Components
import WeatherAnalysis from '../components/climate/WeatherAnalysis';
import VegetationAnalysis from '../components/climate/VegetationAnalysis';
import WaterIrrigationAnalysis from '../components/climate/WaterIrrigationAnalysis';
import SoilLandAnalysis from '../components/climate/SoilLandAnalysis';

// Import Chart.js components
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ClimateAnalysis = () => {
  const { selectedField, selectedLocation } = useAppContext();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('weather');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState({
    temperature: generateMockWeatherData(7, 25, 35),
    humidity: generateMockWeatherData(7, 50, 85),
    rainfall: generateMockWeatherData(7, 0, 25)
  });
  
  const [vegetationData, setVegetationData] = useState({
    ndvi: generateMockNDVIData(7),
    evi: generateMockNDVIData(7, 0.2, 0.7),
    gci: generateMockNDVIData(7, 1, 3, false)
  });
  
  const [waterData, setWaterData] = useState({
    soilMoisture: generateMockWeatherData(7, 30, 70),
    irrigationEvents: [
      { date: '2025-08-11', amount: 15 },
      { date: '2025-08-14', amount: 12 }
    ]
  });
  
  // Check URL parameters for tab selection on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['weather', 'vegetation', 'water', 'soil', 'fire', 'rainfall'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);
  
  // Function to generate mock weather data
  function generateMockWeatherData(days, min, max) {
    const data = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (days - i - 1));
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: parseFloat((Math.random() * (max - min) + min).toFixed(1))
      });
    }
    
    return data;
  }
  
  // Function to generate mock NDVI data
  function generateMockNDVIData(days, min = 0.4, max = 0.85, increaseOverTime = true) {
    const data = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (days - i - 1));
      
      let value;
      if (increaseOverTime) {
        // Slightly increasing trend with some randomness
        value = parseFloat((min + (max - min) * (i / days) + Math.random() * 0.1 - 0.05).toFixed(2));
      } else {
        value = parseFloat((Math.random() * (max - min) + min).toFixed(2));
      }
      
      // Ensure within range
      value = Math.max(min, Math.min(max, value));
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: value
      });
    }
    
    return data;
  }
  
  // Handle date range changes
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Apply date range filter
  const applyDateRange = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const daysDiff = Math.ceil((new Date(dateRange.endDate) - new Date(dateRange.startDate)) / (1000 * 60 * 60 * 24)) + 1;
      
      setWeatherData({
        temperature: generateMockWeatherData(daysDiff, 25, 35),
        humidity: generateMockWeatherData(daysDiff, 50, 85),
        rainfall: generateMockWeatherData(daysDiff, 0, 25)
      });
      
      setVegetationData({
        ndvi: generateMockNDVIData(daysDiff),
        evi: generateMockNDVIData(daysDiff, 0.2, 0.7),
        gci: generateMockNDVIData(daysDiff, 1, 3, false)
      });
      
      setWaterData({
        soilMoisture: generateMockWeatherData(daysDiff, 30, 70),
        irrigationEvents: [
          { date: '2025-08-11', amount: 15 },
          { date: '2025-08-14', amount: 12 }
        ]
      });
      
      setLoading(false);
      setShowDateRangePicker(false);
    }, 1000);
  };
  
  // Generic chart options
  const getChartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        beginAtZero: false
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  });
  
  // Generate chart data for temperature
  const temperatureChartData = {
    labels: weatherData.temperature.map(item => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: weatherData.temperature.map(item => item.value),
        fill: false,
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.3,
        pointBackgroundColor: 'rgb(255, 99, 132)',
      }
    ]
  };
  
  // Generate chart data for rainfall
  const rainfallChartData = {
    labels: weatherData.rainfall.map(item => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Rainfall (mm)',
        data: weatherData.rainfall.map(item => item.value),
        fill: true,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgb(54, 162, 235)',
        tension: 0.3,
        pointBackgroundColor: 'rgb(54, 162, 235)',
      }
    ]
  };
  
  // Generate chart data for NDVI
  const ndviChartData = {
    labels: vegetationData.ndvi.map(item => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'NDVI',
        data: vegetationData.ndvi.map(item => item.value),
        fill: true,
        backgroundColor: 'rgba(75, 192, 75, 0.2)',
        borderColor: 'rgb(75, 192, 75)',
        tension: 0.3,
        pointBackgroundColor: 'rgb(75, 192, 75)',
      }
    ]
  };
  
  // Generate chart data for soil moisture
  const soilMoistureChartData = {
    labels: waterData.soilMoisture.map(item => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Soil Moisture (%)',
        data: waterData.soilMoisture.map(item => item.value),
        fill: true,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgb(54, 162, 235)',
        tension: 0.3,
        pointBackgroundColor: 'rgb(54, 162, 235)',
      }
    ]
  };
  
  // Render content based on active tab
  const renderContent = () => {
    switch(activeTab) {
      case 'weather':
        return (
          <div className="Analytic ">
            <div className="mb-6">
              <h2 className="text-2xl font-bold flex items-center">
                <FontAwesomeIcon icon={faCloudSunRain} className="text-yellow-500 mr-2" />
                Weather Forecast and Analysis
              </h2>
              <p className="text-gray-600">
                Track temperature trends, rainfall patterns, and forecast for your farm.
              </p>
            </div>
            
            <div className="flex items-center mb-4">
              <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md text-sm">
                <FontAwesomeIcon icon={faLocationDot} className="mr-1" />
                <span className="font-medium">{selectedLocation || 'DIT Pune'}</span>
              </div>
              <div className="ml-auto flex space-x-2">
                <button 
                  className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                  onClick={() => setShowDateRangePicker(!showDateRangePicker)}
                >
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
                  <span>Date Range</span>
                </button>
                <button className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm">
                  <FontAwesomeIcon icon={faFilter} className="mr-1" />
                  <span>Filter</span>
                </button>
                <button className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm">
                  <FontAwesomeIcon icon={faDownload} className="mr-1" />
                  <span>Export</span>
                </button>
              </div>
            </div>
            
            {showDateRangePicker && (
              <div className="bg-white shadow-md rounded-md p-4 mb-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">From</label>
                    <input 
                      type="date" 
                      id="startDate" 
                      name="startDate"
                      className="border rounded px-3 py-2"
                      value={dateRange.startDate}
                      onChange={handleDateRangeChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">To</label>
                    <input 
                      type="date" 
                      id="endDate" 
                      name="endDate"
                      className="border rounded px-3 py-2"
                      value={dateRange.endDate}
                      onChange={handleDateRangeChange}
                    />
                  </div>
                  <button 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                    onClick={applyDateRange}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Apply'}
                  </button>
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
                {/* Temperature Chart */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="h-80">
                    <Line data={temperatureChartData} options={getChartOptions('Temperature Trends')} />
                  </div>
                </div>
                
                {/* Rainfall Chart */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="h-80">
                    <Line data={rainfallChartData} options={getChartOptions('Rainfall Patterns')} />
                  </div>
                </div>
                
                {/* Weather Summary */}
                <div className="bg-white p-4 rounded-lg shadow lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-3">Weather Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-md">
                      <div className="text-sm text-gray-600 mb-1">Current Temperature</div>
                      <div className="text-2xl font-bold text-blue-800">
                        {weatherData.temperature[weatherData.temperature.length - 1].value}°C
                      </div>
                      <div className="text-sm text-blue-600 mt-1">
                        {weatherData.temperature[weatherData.temperature.length - 1].value > 30 ? 'Above Average' : 'Normal Range'}
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-md">
                      <div className="text-sm text-gray-600 mb-1">Humidity</div>
                      <div className="text-2xl font-bold text-blue-800">
                        {weatherData.humidity[weatherData.humidity.length - 1].value}%
                      </div>
                      <div className="text-sm text-blue-600 mt-1">
                        {weatherData.humidity[weatherData.humidity.length - 1].value > 70 ? 'High' : 'Moderate'}
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-md">
                      <div className="text-sm text-gray-600 mb-1">7-Day Rainfall</div>
                      <div className="text-2xl font-bold text-blue-800">
                        {weatherData.rainfall.reduce((sum, item) => sum + item.value, 0).toFixed(1)}mm
                      </div>
                      <div className="text-sm text-blue-600 mt-1">
                        {weatherData.rainfall.reduce((sum, item) => sum + item.value, 0) > 50 ? 'Above Average' : 'Below Average'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Weather Forecast */}
                <div className="bg-white p-4 rounded-lg shadow lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-3">5-Day Forecast</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {[...Array(5)].map((_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() + i);
                      
                      // Simulate different weather conditions
                      const conditions = ['sunny', 'partly_cloudy', 'cloudy', 'rainy', 'sunny'];
                      const temps = [32, 31, 28, 27, 30];
                      
                      return (
                        <div key={i} className="text-center p-3 border rounded-md">
                          <div className="text-sm font-medium mb-2">
                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className="text-3xl text-center mb-2">
                            {conditions[i] === 'sunny' && '☀️'}
                            {conditions[i] === 'partly_cloudy' && '⛅'}
                            {conditions[i] === 'cloudy' && '☁️'}
                            {conditions[i] === 'rainy' && '🌧️'}
                          </div>
                          <div className="font-bold">{temps[i]}°C</div>
                          <div className="text-xs text-gray-500">{temps[i] - 8}°C</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'water':
        return (
          <div className="Analytics">
            <div className="mb-6">
              <h2 className="text-2xl font-bold flex items-center">
                <FontAwesomeIcon icon={faDroplet} className="text-blue-500 mr-2" />
                Water & Irrigation
              </h2>
              <p className="text-gray-600">
                Monitor soil moisture, irrigation patterns, and water usage efficiency.
              </p>
            </div>
            
            {loading ? (
              <div className="text-center py-10">
                <div className="spinner border-t-4 border-blue-500 border-solid rounded-full w-12 h-12 mx-auto mb-4 animate-spin"></div>
                <p className="text-gray-600">Loading water data...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Soil Moisture Chart */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="h-80">
                    <Line data={soilMoistureChartData} options={getChartOptions('Soil Moisture')} />
                  </div>
                </div>
                
                {/* Irrigation Recommendations */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-3">Irrigation Recommendations</h3>
                  
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                      <div className="flex items-start">
                        <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 mt-1 mr-2" />
                        <div>
                          <h4 className="font-medium">Next Irrigation Schedule</h4>
                          <p className="text-sm text-gray-600">Based on soil moisture trends and weather forecast, schedule next irrigation for <span className="font-medium">August 17, 2025</span>.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                      <div className="flex items-start">
                        <FontAwesomeIcon icon={faTriangleExclamation} className="text-yellow-500 mt-1 mr-2" />
                        <div>
                          <h4 className="font-medium">Water Conservation Alert</h4>
                          <p className="text-sm text-gray-600">Lower North field section shows higher than average water usage. Consider adjusting irrigation in this area.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Irrigation History */}
                <div className="bg-white p-4 rounded-lg shadow lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-3">Irrigation History</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field Section</th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Water Used</th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Aug 14, 2025</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">North Field</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">12,000 L</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1h 45m</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Aug 11, 2025</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">All Sections</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">15,000 L</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2h 15m</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Aug 8, 2025</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">South Field</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">8,500 L</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1h 10m</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'vegetation':
        return (
          <div className="Analytics">
            <div className="mb-6">
              <h2 className="text-2xl font-bold flex items-center">
                <FontAwesomeIcon icon={faLeaf} className="text-green-600 mr-2" />
                Vegetation & Crop Health
              </h2>
              <p className="text-gray-600">
                Monitor crop health indicators, vegetation indices, and growth patterns.
              </p>
            </div>
            
            {loading ? (
              <div className="text-center py-10">
                <div className="spinner border-t-4 border-green-500 border-solid rounded-full w-12 h-12 mx-auto mb-4 animate-spin"></div>
                <p className="text-gray-600">Loading vegetation data...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* NDVI Chart */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">NDVI - Normalized Difference Vegetation Index</h3>
                    <button className="text-gray-500 hover:text-gray-700">
                      <FontAwesomeIcon icon={faInfoCircle} />
                    </button>
                  </div>
                  <div className="mb-4 p-3 bg-gray-50 rounded-md text-sm">
                    <p>NDVI measures <b>green vegetation amount & health</b> using NIR and red light reflectance.</p>
                    <p className="mt-1"><b>Range</b>: -1 to +1</p>
                    <p className="mt-1"><b>Interpretation</b>: Higher values indicate healthier vegetation.</p>
                  </div>
                  <div className="h-72">
                    <Line data={ndviChartData} options={getChartOptions('NDVI Trend')} />
                  </div>
                </div>
                
                {/* Health Analysis */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-3">Crop Health Analysis</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Overall Health</span>
                        <span className="text-sm font-medium">
                          {vegetationData.ndvi[vegetationData.ndvi.length - 1].value > 0.7 ? 'Excellent' : 
                          vegetationData.ndvi[vegetationData.ndvi.length - 1].value > 0.5 ? 'Good' : 'Fair'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-green-500 h-2.5 rounded-full" 
                          style={{ width: `${vegetationData.ndvi[vegetationData.ndvi.length - 1].value * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Stress Detection</span>
                        <span className="text-sm font-medium">Low</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-yellow-500 h-2.5 rounded-full" 
                          style={{ width: '15%' }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Growth Rate</span>
                        <span className="text-sm font-medium">Normal</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-500 h-2.5 rounded-full" 
                          style={{ width: '65%' }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                      <div className="flex items-start">
                        <FontAwesomeIcon icon={faInfoCircle} className="text-green-500 mt-1 mr-2" />
                        <div>
                          <h4 className="font-medium">Recommendation</h4>
                          <p className="text-sm text-gray-600">Crop health indicators are within normal ranges. Continue current management practices and monitor for any changes in NDVI values.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Vegetation Comparison */}
                <div className="bg-white p-4 rounded-lg shadow lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-3">Field Section Comparison</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-md">
                      <div className="text-center mb-2">
                        <span className="text-sm font-medium text-gray-500">North Section</span>
                      </div>
                      <div className="flex justify-center mb-2">
                        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-2xl font-bold text-green-700">0.78</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Excellent</span>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-md">
                      <div className="text-center mb-2">
                        <span className="text-sm font-medium text-gray-500">Central Section</span>
                      </div>
                      <div className="flex justify-center mb-2">
                        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-2xl font-bold text-green-700">0.72</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Good</span>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-md">
                      <div className="text-center mb-2">
                        <span className="text-sm font-medium text-gray-500">South Section</span>
                      </div>
                      <div className="flex justify-center mb-2">
                        <div className="h-20 w-20 rounded-full bg-yellow-100 flex items-center justify-center">
                          <span className="text-2xl font-bold text-yellow-700">0.61</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Moderate</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
        
      default:
        return (
          <div className="Analytics">
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <h3 className="text-xl font-semibold mb-2">Feature Coming Soon</h3>
              <p className="text-gray-600 mb-4">This analytics feature is currently in development.</p>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                Request Early Access
              </button>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div>
      <div className="mb-6 max-w-screen">
        <h1 className="text-2xl font-bold mb-2 flex items-center">
          <FontAwesomeIcon icon={faChartLine} className="text-gray-700 mr-2" />
          Climate Analysis
        </h1>
        <p className="text-gray-600">
          Analyze climate and environmental data to make informed farming decisions.
        </p>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('weather')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'weather'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FontAwesomeIcon icon={faCloudSunRain} className="mr-2" />
            Weather
          </button>
          
          <button
            onClick={() => setActiveTab('vegetation')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'vegetation'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FontAwesomeIcon icon={faLeaf} className="mr-2" />
            Vegetation
          </button>
          
          <button
            onClick={() => setActiveTab('soil')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'soil'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FontAwesomeIcon icon={faLayerGroup} className="mr-2" />
            Soil & Land
          </button>
          
          <button
            onClick={() => setActiveTab('water')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'water'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FontAwesomeIcon icon={faDroplet} className="mr-2" />
            Water & Irrigation
          </button>
          
          <button
            onClick={() => setActiveTab('rainfall')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rainfall'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FontAwesomeIcon icon={faCloudRain} className="mr-2" />
            Rainfall & Monsoon
          </button>
          
          <button
            onClick={() => setActiveTab('fire')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'fire'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FontAwesomeIcon icon={faFire} className="mr-2" />
            Fire & Hazards
          </button>
        </nav>
      </div>

      {/* Render analysis component based on selected tab */}
      <div className="analysis-container">
        {activeTab === 'weather' && (
          <WeatherAnalysis 
            dateRange={dateRange} 
            onDateRangeChange={handleDateRangeChange}
            showDateRangePicker={showDateRangePicker}
            setShowDateRangePicker={setShowDateRangePicker}
          />
        )}
        
        {activeTab === 'vegetation' && (
          <VegetationAnalysis dateRange={dateRange} />
        )}
        
        {activeTab === 'soil' && (
          <SoilLandAnalysis dateRange={dateRange} loading={loading} setLoading={setLoading} />
        )}
        
        {activeTab === 'water' && (
          <WaterIrrigationAnalysis dateRange={dateRange} />
        )}
        
        {(activeTab === 'rainfall' || activeTab === 'fire') && (
          <div className="Analytics">
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <h3 className="text-xl font-semibold mb-2">Feature Coming Soon</h3>
              <p className="text-gray-600 mb-4">This analytics feature is currently in development.</p>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                Request Early Access
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClimateAnalysis;
