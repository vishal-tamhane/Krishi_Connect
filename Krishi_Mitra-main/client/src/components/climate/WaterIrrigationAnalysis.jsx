import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDroplet,
  faInfoCircle,
  faTriangleExclamation,
  faTable,
  faLeaf,
  faChartLine,
  faFlask,
  faWater,
  faMapMarkerAlt,
  faTint
} from '@fortawesome/free-solid-svg-icons';
import { Chart as ChartJS, LineElement, PointElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useAppContext } from '../../context/AppContext';
import { fetchWaterData } from '../../services/climateService';
import Papa from 'papaparse';

// Register ChartJS components
ChartJS.register(
  LineElement,
  PointElement, 
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const WaterIrrigationAnalysis = ({ dateRange }) => {
  // Fix 3: Define loading state here instead of receiving as props
  const [loading, setLoading] = useState(false);
  const { selectedField, selectedLocation } = useAppContext();
  const [waterData, setWaterData] = useState({
    soilMoisture: [],
    irrigationEvents: [],
    recommendations: []
  });
  
  // New state for water indices from CSV files
  const [waterIndices, setWaterIndices] = useState({
    ndwi: [],
    ndmi: [],
    awei: [],
    sarwi: [],
    ewi: [],
    loading: true
  });

  // Key observations and nutrient content
  const [keyObservations, setKeyObservations] = useState({
    health: { value: 85, status: 'Good' },
    stress: { value: 12, status: 'Low' },
    aging: { value: 28, status: 'Normal' },
    chlorophyll: { value: 75, status: 'Optimal' },
    nutrients: {
      nitrogen: { value: 42, status: 'Adequate' },
      phosphorus: { value: 28, status: 'Low' },
      potassium: { value: 165, status: 'High' },
      magnesium: { value: 52, status: 'Adequate' }
    }
  });
  
  // Fix 2: Add refs for chart instances to properly clean up
  const soilMoistureChartRef = useRef(null);
  const waterIndicesChartRef = useRef(null);
  const nutrientsChartRef = useRef(null);
  
  useEffect(() => {
    loadWaterData();
    loadWaterIndicesFromCsv();
    
    // Cleanup function to destroy chart instances when unmounting
    return () => {
      if (soilMoistureChartRef.current) {
        soilMoistureChartRef.current.destroy();
      }
      if (waterIndicesChartRef.current) {
        waterIndicesChartRef.current.destroy();
      }
      if (nutrientsChartRef.current) {
        nutrientsChartRef.current.destroy();
      }
    };
  }, [selectedField, selectedLocation, dateRange]);
  
  const loadWaterData = async () => {
    setLoading(true);
    try {
      const data = await fetchWaterData(
        selectedField, 
        selectedLocation, 
        dateRange
      );
      setWaterData(data);
    } catch (error) {
      console.error('Error loading water data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to load water indices from CSV files
  const loadWaterIndicesFromCsv = async () => {
    setWaterIndices(prev => ({ ...prev, loading: true }));
    
    try {
      // Helper function to fetch and parse CSV
      const fetchCsv = async (filename) => {
        const response = await fetch(`/local_csv/${filename}`);
        const text = await response.text();
        return Papa.parse(text, { header: true, skipEmptyLines: true }).data;
      };
      
      // Load all CSV files in parallel
      const [ndwiData, ndmiData, aweiData, sarwiData, ewiData] = await Promise.all([
        fetchCsv('ndwi.csv'),
        fetchCsv('ndmi.csv'),
        fetchCsv('awei.csv'),
        fetchCsv('sarwi.csv'),
        fetchCsv('ewi.csv')
      ]);
      
      // Process each dataset to extract date and values
      const processData = (data, valueField) => {
        return data.map(item => ({
          date: item.date,
          value: parseFloat(item[valueField])
        })).filter(item => !isNaN(item.value))
         .sort((a, b) => new Date(a.date) - new Date(b.date));
      };
      
      setWaterIndices({
        ndwi: processData(ndwiData, 'ndwi'),
        ndmi: processData(ndmiData, 'ndmi'),
        awei: processData(aweiData, 'awei'),
        sarwi: processData(sarwiData, 'sarwi'),
        ewi: processData(ewiData, 'ewi'),
        loading: false
      });
      
    } catch (error) {
      console.error('Error loading water indices from CSV:', error);
      setWaterIndices(prev => ({ ...prev, loading: false }));
    }
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
        cornerRadius: 4,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y !== null ? context.parsed.y.toFixed(3) : 'N/A';
            return `${label.split(' - ')[0]}: ${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
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
        beginAtZero: customOptions.beginAtZero !== undefined ? customOptions.beginAtZero : false,
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
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    elements: {
      line: {
        borderWidth: 2
      },
      point: {
        hitRadius: 8
      }
    }
  });
  
  // Generate chart data for soil moisture
  const soilMoistureChartData = {
    labels: waterData.soilMoisture?.map(item => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) || [],
    datasets: [
      {
        label: 'Soil Moisture (%)',
        data: waterData.soilMoisture?.map(item => item.value) || [],
        fill: true,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgb(54, 162, 235)',
        tension: 0.3,
        pointBackgroundColor: 'rgb(54, 162, 235)',
      }
    ]
  };
  
  // Generate chart data for water indices with enhanced visualization
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    } catch (e) {
      console.error('Invalid date:', dateString);
      return '';
    }
  };
  
  const getWaterIndicesChartData = (indices = waterIndices) => {
    // Enhanced color map with more visually distinct colors
    const colorMap = {
      ndwi: {
        border: 'rgb(25, 118, 210)',  // Deep blue
        background: 'rgba(25, 118, 210, 0.1)',
        pointBgColor: 'rgb(25, 118, 210)',
        pointBorderColor: 'white',
        dashed: false
      },
      ndmi: {
        border: 'rgb(56, 142, 60)',  // Forest green
        background: 'rgba(56, 142, 60, 0.1)',
        pointBgColor: 'rgb(56, 142, 60)',
        pointBorderColor: 'white',
        dashed: false
      },
      awei: {
        border: 'rgb(123, 31, 162)',  // Purple
        background: 'rgba(123, 31, 162, 0.1)',
        pointBgColor: 'rgb(123, 31, 162)',
        pointBorderColor: 'white',
        dashed: false
      },
      sarwi: {
        border: 'rgb(255, 111, 0)',  // Deep orange
        background: 'rgba(255, 111, 0, 0.1)',
        pointBgColor: 'rgb(255, 111, 0)',
        pointBorderColor: 'white',
        dashed: true  // Use dashed line for better distinction
      },
      ewi: {
        border: 'rgb(211, 47, 47)',  // Deep red
        background: 'rgba(211, 47, 47, 0.1)',
        pointBgColor: 'rgb(211, 47, 47)',
        pointBorderColor: 'white',
        dashed: true  // Use dashed line for better distinction
      }
    };
    
    // Find all dates from all indices
    const allDates = new Set();
    Object.entries(indices)
      .filter(([key, value]) => key !== 'loading' && Array.isArray(value) && value.length > 0)
      .forEach(([_, dataset]) => {
        dataset.forEach(item => {
          if (item.date) allDates.add(item.date);
        });
      });
    
    const sortedDates = [...allDates].sort((a, b) => new Date(a) - new Date(b));
    const labels = sortedDates.map(date => formatDate(date));
    
    // Create datasets for each index with enhanced visualization properties
    const datasets = [];
    
    // Define display names and ensure normalized ranges for better comparison
    const indexDefinitions = {
      ndwi: { 
        label: 'NDWI - Water Index',
        description: 'Surface water detection',
        order: 1
      },
      ndmi: { 
        label: 'NDMI - Moisture Index',
        description: 'Vegetation moisture content',
        order: 2
      },
      awei: { 
        label: 'AWEI - Water Extraction',
        description: 'Enhanced water extraction',
        order: 3
      },
      sarwi: { 
        label: 'SARWI - Radar-based Index',
        description: 'Radar water detection',
        order: 4
      },
      ewi: { 
        label: 'EWI - Enhanced Wetness',
        description: 'Improved wetness detection',
        order: 5
      }
    };
    
    // Process each index type
    const processedIndices = Object.entries(indices)
      .filter(([key, value]) => key !== 'loading' && Array.isArray(value) && value.length > 0)
      .sort(([keyA], [keyB]) => {
        // Sort by defined order to ensure consistent legend display
        return (indexDefinitions[keyA]?.order || 99) - (indexDefinitions[keyB]?.order || 99);
      });
      
    processedIndices.forEach(([key, data]) => {
      // Create a map of date to value for quick lookup
      const dateValueMap = {};
      data.forEach(item => {
        // Ensure we have valid numeric values
        if (item.date && !isNaN(parseFloat(item.value))) {
          dateValueMap[item.date] = parseFloat(item.value);
        }
      });
      
      // Only include datasets that actually have values
      if (Object.keys(dateValueMap).length > 0) {
        // For each date, get the value or null
        const values = sortedDates.map(date => {
          const value = dateValueMap[date];
          return value !== undefined ? value : null;
        });
        
        // Get index information
        const indexInfo = indexDefinitions[key] || { 
          label: key.toUpperCase(), 
          description: 'Water/moisture index'
        };
        
        // Create enhanced dataset with proper styling
        datasets.push({
          label: indexInfo.label,
          data: values,
          borderColor: colorMap[key].border,
          backgroundColor: colorMap[key].background,
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointRadius: 5,
          pointStyle: 'circle',
          pointBackgroundColor: colorMap[key].pointBgColor,
          pointBorderColor: colorMap[key].pointBorderColor,
          pointBorderWidth: 1.5,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: colorMap[key].pointBgColor,
          pointHoverBorderColor: 'white',
          pointHoverBorderWidth: 2,
          borderDash: colorMap[key].dashed ? [5, 5] : undefined,
          borderCapStyle: 'round',
          borderJoinStyle: 'round',
          spanGaps: true, // Connect lines across missing data points
          clip: 5,
          order: indexInfo.order || 1
        });
      }
    });
    
    // If no datasets were created, create a placeholder dataset
    if (datasets.length === 0) {
      datasets.push({
        label: 'No Data Available',
        data: sortedDates.map(() => null),
        borderColor: 'rgb(200, 200, 200)',
        backgroundColor: 'rgba(200, 200, 200, 0.1)',
        borderWidth: 2,
        fill: false
      });
    }
    
    return {
      labels,
      datasets
    };
  };
  
  // Generate the chart data directly during component render for fresh data
  const waterIndicesChartData = getWaterIndicesChartData();
  
  // Generate chart data for nutrients
  const nutrientsChartData = {
    labels: ['Nitrogen', 'Phosphorus', 'Potassium', 'Magnesium'],
    datasets: [
      {
        label: 'Nutrient Content',
        data: [
          keyObservations.nutrients.nitrogen.value,
          keyObservations.nutrients.phosphorus.value,
          keyObservations.nutrients.potassium.value,
          keyObservations.nutrients.magnesium.value
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ],
        borderColor: [
          'rgb(75, 192, 192)',
          'rgb(255, 159, 64)',
          'rgb(54, 162, 235)',
          'rgb(153, 102, 255)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'good':
      case 'optimal':
      case 'high':
      case 'adequate':
        return 'bg-green-100 text-green-800';
      case 'moderate':
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
          {/* Soil Moisture Chart - Enhanced UI */}
          <div className="bg-white p-5 rounded-lg shadow-lg border border-gray-100">
            <div className="flex items-center mb-4">
              <span className="text-blue-600 mr-3">
                <FontAwesomeIcon icon={faTint} size="lg" />
              </span>
              <h3 className="text-lg font-semibold">Soil Moisture Trends</h3>
            </div>
            <div className="h-80">
              <Line 
                data={soilMoistureChartData} 
                options={getChartOptions('Soil Moisture Over Time', {
                  yAxisTitle: 'Moisture (%)',
                  beginAtZero: true
                })} 
                ref={soilMoistureChartRef} 
              />
            </div>
          </div>
          
          {/* Irrigation Recommendations - Enhanced UI */}
          <div className="bg-white p-5 rounded-lg shadow-lg border border-gray-100">
            <div className="flex items-center mb-4">
              <span className="text-green-600 mr-3">
                <FontAwesomeIcon icon={faWater} size="lg" />
              </span>
              <h3 className="text-lg font-semibold">Irrigation Recommendations</h3>
            </div>
            
            <div className="space-y-4">
              {waterData.recommendations?.map((recommendation, index) => (
                <div 
                  key={index} 
                  className={`p-3 ${
                    recommendation.priority === 'warning' 
                      ? 'bg-yellow-50 border-l-4 border-yellow-500' 
                      : 'bg-blue-50 border-l-4 border-blue-500'
                  } rounded`}
                >
                  <div className="flex items-start">
                    <FontAwesomeIcon 
                      icon={recommendation.priority === 'warning' ? faTriangleExclamation : faInfoCircle} 
                      className={recommendation.priority === 'warning' ? 'text-yellow-500 mt-1 mr-2' : 'text-blue-500 mt-1 mr-2'} 
                    />
                    <div>
                      <h4 className="font-medium">{recommendation.title}</h4>
                      <p className="text-sm text-gray-600">{recommendation.description}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {!waterData.recommendations?.length && (
                <div className="p-3 bg-gray-50 border-l-4 border-gray-300 rounded">
                  <p className="text-sm text-gray-600">No irrigation recommendations available for the selected period.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Water Indices Chart - Enhanced UI */}
          <div className="bg-white p-5 rounded-lg shadow-lg border border-gray-100 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <FontAwesomeIcon icon={faChartLine} className="text-blue-600 mr-2" />
              Water Indices Analysis
            </h3>
            
            <div className="mb-4 p-4 bg-blue-50 rounded-lg text-sm border-l-4 border-blue-400">
              <h4 className="font-semibold mb-2 text-blue-800">About Water Indices</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-2 bg-white rounded shadow-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[rgb(25,118,210)] mr-2"></div>
                    <span className="font-bold text-gray-800">NDWI</span>
                  </div>
                  <p className="mt-1 text-gray-600">Normalized Difference Water Index - Detects surface water content</p>
                </div>
                <div className="p-2 bg-white rounded shadow-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[rgb(56,142,60)] mr-2"></div>
                    <span className="font-bold text-gray-800">NDMI</span>
                  </div>
                  <p className="mt-1 text-gray-600">Normalized Difference Moisture Index - Measures vegetation moisture</p>
                </div>
                <div className="p-2 bg-white rounded shadow-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[rgb(123,31,162)] mr-2"></div>
                    <span className="font-bold text-gray-800">AWEI</span>
                  </div>
                  <p className="mt-1 text-gray-600">Automated Water Extraction Index - Enhanced water body detection</p>
                </div>
                <div className="p-2 bg-white rounded shadow-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[rgb(255,111,0)] mr-2"></div>
                    <span className="font-bold text-gray-800">SARWI</span>
                  </div>
                  <p className="mt-1 text-gray-600">Radar-based Water Index - Uses radar for water mapping</p>
                </div>
                <div className="p-2 bg-white rounded shadow-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[rgb(211,47,47)] mr-2"></div>
                    <span className="font-bold text-gray-800">EWI</span>
                  </div>
                  <p className="mt-1 text-gray-600">Enhanced Wetness Index - Improved wetness detection accuracy</p>
                </div>
                <div className="p-2 bg-white rounded shadow-sm">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 mr-2" />
                    <span className="font-bold text-gray-800">Interpretation</span>
                  </div>
                  <p className="mt-1 text-gray-600">Higher values generally indicate more water content/moisture</p>
                </div>
              </div>
            </div>
            
            <div className="h-96">
              {waterIndices.loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="spinner border-t-4 border-blue-500 border-solid rounded-full w-10 h-10 animate-spin"></div>
                </div>
              ) : (
                <Line 
                  data={waterIndicesChartData} 
                  options={getChartOptions('Water Indices Over Time', {
                    yAxisTitle: 'Index Value',
                    beginAtZero: false
                  })} 
                  ref={waterIndicesChartRef} 
                />
              )}
            </div>
            
            <div className="mt-3 bg-gray-50 p-3 rounded-md text-xs text-gray-600 flex items-center">
              <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 mr-2" />
              <span>Indices are calculated from multispectral satellite imagery and updated weekly.</span>
            </div>
          </div>
          
          {/* Key Observations - Enhanced UI */}
          <div className="bg-white p-5 rounded-lg shadow-lg border border-gray-100">
            <div className="flex items-center mb-4">
              <span className="text-green-600 mr-3">
                <FontAwesomeIcon icon={faLeaf} size="lg" />
              </span>
              <h3 className="text-lg font-semibold">Key Observations</h3>
            </div>
            
            <div className="space-y-4">
              {/* Health Status */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Health</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(keyObservations.health.status)}`}>
                    {keyObservations.health.status}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full" 
                    style={{ width: `${keyObservations.health.value}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Stress */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Stress</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(keyObservations.stress.status)}`}>
                    {keyObservations.stress.status}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-yellow-500 h-2.5 rounded-full" 
                    style={{ width: `${keyObservations.stress.value}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Aging */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Aging</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(keyObservations.aging.status)}`}>
                    {keyObservations.aging.status}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full" 
                    style={{ width: `${keyObservations.aging.value}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Chlorophyll */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Chlorophyll</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(keyObservations.chlorophyll.status)}`}>
                    {keyObservations.chlorophyll.status}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full" 
                    style={{ width: `${keyObservations.chlorophyll.value}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Nutrients Content - Enhanced UI */}
          <div className="bg-white p-5 rounded-lg shadow-lg border border-gray-100">
            <div className="flex items-center mb-4">
              <span className="text-amber-600 mr-3">
                <FontAwesomeIcon icon={faFlask} size="lg" />
              </span>
              <h3 className="text-lg font-semibold">Nutrients Content</h3>
            </div>
            
            <div className="h-60 mb-4">
              <Bar 
                data={nutrientsChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    },
                    title: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }} 
                ref={nutrientsChartRef}
              />
            </div>
            
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nutrients</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Nitrogen</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-gray-900">{keyObservations.nutrients.nitrogen.value}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-center">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(keyObservations.nutrients.nitrogen.status)}`}>
                        {keyObservations.nutrients.nitrogen.status}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Phosphorus</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-gray-900">{keyObservations.nutrients.phosphorus.value}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-center">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(keyObservations.nutrients.phosphorus.status)}`}>
                        {keyObservations.nutrients.phosphorus.status}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Potassium</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-gray-900">{keyObservations.nutrients.potassium.value}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-center">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(keyObservations.nutrients.potassium.status)}`}>
                        {keyObservations.nutrients.potassium.status}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Magnesium</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-gray-900">{keyObservations.nutrients.magnesium.value}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-center">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(keyObservations.nutrients.magnesium.status)}`}>
                        {keyObservations.nutrients.magnesium.status}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Irrigation History - Enhanced UI */}
          <div className="bg-white p-5 rounded-lg shadow-lg border border-gray-100 lg:col-span-2">
            <div className="flex items-center mb-4">
              <span className="text-gray-600 mr-3">
                <FontAwesomeIcon icon={faTable} size="lg" />
              </span>
              <h3 className="text-lg font-semibold">Irrigation History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field Section</th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Water Used (L)</th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {waterData.irrigationEvents?.map((event, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.fieldSection}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.duration}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          event.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                          event.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                          event.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  
                  {!waterData.irrigationEvents?.length && (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        No irrigation events found for the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Water Efficiency Metrics - Enhanced UI */}
          <div className="bg-white p-5 rounded-lg shadow-lg border border-gray-100 lg:col-span-2">
            <div className="flex items-center mb-4">
              <span className="text-blue-600 mr-3">
                <FontAwesomeIcon icon={faDroplet} size="lg" />
              </span>
              <h3 className="text-lg font-semibold">Water Efficiency Metrics</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-md">
                <div className="text-sm text-gray-600 mb-1">Water Use Efficiency</div>
                <div className="text-2xl font-bold text-blue-800">87%</div>
                <div className="text-sm text-blue-600 mt-1">Above Average</div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-md">
                <div className="text-sm text-gray-600 mb-1">Total Water Used (30 days)</div>
                <div className="text-2xl font-bold text-blue-800">35,500 L</div>
                <div className="text-sm text-blue-600 mt-1">12% less than last month</div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-md">
                <div className="text-sm text-gray-600 mb-1">Irrigation Frequency</div>
                <div className="text-2xl font-bold text-blue-800">3.2 days</div>
                <div className="text-sm text-blue-600 mt-1">Average interval between events</div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-md">
                <div className="text-sm text-gray-600 mb-1">Water Savings</div>
                <div className="text-2xl font-bold text-blue-800">15%</div>
                <div className="text-sm text-blue-600 mt-1">Compared to regional average</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterIrrigationAnalysis;
