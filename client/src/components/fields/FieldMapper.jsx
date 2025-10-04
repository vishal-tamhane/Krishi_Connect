import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMap, 
  faSave, 
  faEraser, 
  faExclamationTriangle, 
  faSeedling,
  faLocationDot,
  faTag,
  faMapMarkerAlt,
  faInfoCircle,
  faEdit,
  faCheckCircle,
  faLayerGroup,
  faRulerCombined,
  faMapPin,
  faSpinner,
  faDrawPolygon,
  faLandmark
} from '@fortawesome/free-solid-svg-icons';
import { createField } from '../../services/dataService';
import googleMapsLoader from '../../utils/googleMapsLoader';
import './FieldMapper.css';

const FieldMapper = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [drawingManager, setDrawingManager] = useState(null);
  const [currentPolygon, setCurrentPolygon] = useState(null);
  const [fieldName, setFieldName] = useState('');
  const [fieldLocation, setFieldLocation] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [coordinates, setCoordinates] = useState([]);
  const [message, setMessage] = useState({ show: false, text: '', type: 'info' });
  const [loading, setLoading] = useState(false);
  const [drawingMode, setDrawingMode] = useState(true); // True = Draw Mode, False = Edit Mode
  const [fieldArea, setFieldArea] = useState(0);
  
  // List of major crops grown in India
  const cropOptions = [
    'Rice', 'Wheat', 'Maize', 'Jowar (Sorghum)', 'Bajra (Pearl Millet)', 
    'Cotton', 'Sugarcane', 'Pulses', 'Groundnut', 'Mustard', 
    'Soybean', 'Sunflower', 'Jute', 'Coffee', 'Tea', 
    'Rubber', 'Tobacco', 'Onion', 'Potato', 'Tomato'
  ];

  // Initialize the Google Maps and drawing tools
  useEffect(() => {
    const loadMaps = async () => {
      try {
        await googleMapsLoader.loadGoogleMaps(['drawing', 'geometry']);
        initMap();
      } catch (error) {
        setMessage({
          show: true,
          text: "Failed to load Google Maps. Please check your internet connection.",
          type: 'error'
        });
      }
    };

    loadMaps();
  }, []);

  const initMap = () => {
    if (!mapRef.current) return;
    
    // Check if Google Maps API is properly loaded
    if (!window.google || !window.google.maps) {
      setMessage({
        show: true,
        text: "Google Maps API not loaded properly. Please refresh the page.",
        type: 'error'
      });
      return;
    }
    
    // Custom map style to enhance agricultural features
    const mapStyle = [
      {
        "featureType": "landscape.natural",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#dde2e3"
          },
          {
            "visibility": "on"
          }
        ]
      },
      {
        "featureType": "poi.park",
        "elementType": "all",
        "stylers": [
          {
            "color": "#c6e8b3"
          },
          {
            "visibility": "on"
          }
        ]
      },
      {
        "featureType": "poi.park",
        "elementType": "geometry.fill",
        "stylers": [
          {
            "color": "#c6e8b3"
          },
          {
            "visibility": "on"
          }
        ]
      }
    ];
    
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: { lat: 20.5937, lng: 78.9629 }, // Center on India
      zoom: 6,
      mapTypeId: 'satellite', // Changed to satellite for better field visualization
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: window.google.maps.ControlPosition.TOP_LEFT,
        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
      },
      streetViewControl: false,
      fullscreenControl: true,
      styles: mapStyle,
      scaleControl: true,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_BOTTOM
      }
    });
    
    // Check if drawing library is loaded
    if (!window.google.maps.drawing || !window.google.maps.drawing.DrawingManager) {
      setMessage({
        show: true,
        text: "Google Maps Drawing library not loaded. Please refresh the page.",
        type: 'error'
      });
      return;
    }
    
    const drawingManagerInstance = new window.google.maps.drawing.DrawingManager({
      drawingMode: window.google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_CENTER,
        drawingModes: ['polygon']
      },
      polygonOptions: {
        strokeColor: '#2563eb',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#2563eb',
        fillOpacity: 0.35,
        editable: true
      }
    });
    
    drawingManagerInstance.setMap(mapInstance);
    
    window.google.maps.event.addListener(
      drawingManagerInstance, 
      'polygoncomplete', 
      (polygon) => handlePolygonComplete(polygon)
    );
    
    setMap(mapInstance);
    setDrawingManager(drawingManagerInstance);
  };

  const handlePolygonComplete = (polygon) => {
    // Remove previous polygon if it exists
    if (currentPolygon) {
      currentPolygon.setMap(null);
    }
    
    setCurrentPolygon(polygon);
    
    // Turn off drawing mode
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
    }
    
    // Get coordinates from polygon
    const coords = getPolygonCoordinates(polygon);
    setCoordinates(coords);
    
    // Calculate field area
    const area = calculatePolygonArea(coords);
    setFieldArea(area);
    
    // Add listener for path changes
    const updateCoordinatesAndArea = () => {
      const updatedCoords = getPolygonCoordinates(polygon);
      setCoordinates(updatedCoords);
      setFieldArea(calculatePolygonArea(updatedCoords));
    };
    
    window.google.maps.event.addListener(
      polygon.getPath(), 
      'set_at', 
      updateCoordinatesAndArea
    );
    
    window.google.maps.event.addListener(
      polygon.getPath(), 
      'insert_at', 
      updateCoordinatesAndArea
    );
    
    // Display success message
    setMessage({
      show: true,
      text: "Field boundary drawn successfully! Fill in the details and save.",
      type: 'success'
    });
    
    // Switch to edit mode
    setDrawingMode(false);
  };

  const getPolygonCoordinates = (polygon) => {
    if (!polygon) return [];
    
    const path = polygon.getPath();
    const coords = [];
    
    path.forEach(latLng => {
      coords.push({ lat: latLng.lat(), lng: latLng.lng() });
    });
    
    return coords;
  };

  const handleClearAll = () => {
    if (currentPolygon) {
      currentPolygon.setMap(null);
      setCurrentPolygon(null);
    }
    
    setCoordinates([]);
    setFieldName('');
    setFieldLocation('');
    setSelectedCrop('');
    setFieldArea(0);
    
    if (drawingManager) {
      drawingManager.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
    }
    
    // Switch back to drawing mode
    setDrawingMode(true);
    
    setMessage({
      show: true,
      text: "Map cleared. Draw a new field boundary.",
      type: 'info'
    });
  };
  
  // Toggle between draw and edit modes
  const toggleDrawingMode = () => {
    if (drawingMode) {
      // Switching to edit mode
      if (drawingManager) {
        drawingManager.setDrawingMode(null);
      }
    } else {
      // Switching to draw mode
      if (drawingManager) {
        drawingManager.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
      }
    }
    setDrawingMode(!drawingMode);
  };

  const handleSaveField = async () => {
    // Validate input
    if (!fieldName.trim()) {
      setMessage({
        show: true,
        text: "Please enter a field name.",
        type: 'error'
      });
      return;
    }
    
    if (!fieldLocation.trim()) {
      setMessage({
        show: true,
        text: "Please enter a field location.",
        type: 'error'
      });
      return;
    }
    
    if (!selectedCrop) {
      setMessage({
        show: true,
        text: "Please select a crop for this field.",
        type: 'error'
      });
      return;
    }
    
    if (!coordinates || coordinates.length < 3) {
      setMessage({
        show: true,
        text: "Please draw a polygon with at least 3 points.",
        type: 'error'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Calculate field area in hectares
      const area = calculatePolygonArea(coordinates);
      
      // Validate data before sending
      if (!fieldName.trim()) {
        throw new Error('Field name is required');
      }
      
      if (!coordinates || coordinates.length < 3) {
        throw new Error('Please draw a field boundary with at least 3 points');
      }
      
      if (area <= 0) {
        throw new Error('Invalid field area calculated. Please redraw the field boundary');
      }
      
      // Create field data object (matching Flask backend schema)
      const fieldData = {
        field_name: fieldName.trim(),
        location: fieldLocation.trim(),
        coordinates: coordinates,
        area: Math.round(area * 100) / 100, // Round to 2 decimal places
        current_crop: selectedCrop,
        soil_type: 'Unknown', // Default value
        status: 'Active'
      };
      
      console.log('Sending field data to Flask backend:', fieldData);
      
      // Save to Flask backend using dataService
      const result = await createField(fieldData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save field data');
      }
      
      setMessage({
        show: true,
        text: `Field "${fieldName}" saved successfully! Your farm plot has been added to the database.`,
        type: 'success'
      });
      
      // Clear form after successful save but keep the success message visible
      if (currentPolygon) {
        currentPolygon.setMap(null);
        setCurrentPolygon(null);
      }
      
      setCoordinates([]);
      setFieldName('');
      setFieldLocation('');
      setSelectedCrop('');
      setFieldArea(0);
      
      // Switch back to drawing mode
      if (drawingManager) {
        drawingManager.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
      }
      setDrawingMode(true);
      
    } catch (error) {
      console.error('Error saving field:', error);
      setMessage({
        show: true,
        text: `Error: ${error.message}. Please try again.`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="field-mapper">
      <div className="field-mapper-header">
        <h2>
          <FontAwesomeIcon icon={faDrawPolygon} className="mr-2" />
          Create Farm Plot
        </h2>
        <p>Draw your field boundaries on the map and add crop information for better farm management and analytics.</p>
      </div>
      
      <div className="field-mapper-container">
        <div className="map-section">
          <div className="action-buttons">
            <button 
              className={`btn ${drawingMode ? 'btn-save' : 'btn-secondary'}`}
              onClick={toggleDrawingMode}
              disabled={loading || !currentPolygon}
            >
              <FontAwesomeIcon icon={drawingMode ? faEdit : faMapPin} />
              {drawingMode ? 'Edit Mode' : 'Draw Mode'}
            </button>
            
            <button 
              className="btn btn-clear" 
              onClick={handleClearAll}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faEraser} />
              Clear All
            </button>
          </div>
          
          <div className="map-wrapper">
            <div 
              ref={mapRef} 
              className="map-container"
            ></div>
            
            <div className="mode-indicator">
              <FontAwesomeIcon icon={drawingMode ? faMapPin : faEdit} />
              {drawingMode ? 'Drawing Mode' : 'Edit Mode'}
            </div>
            
            <div className="map-instructions">
              <FontAwesomeIcon icon={faInfoCircle} />
              {drawingMode 
                ? 'Click on the map to add points and create a polygon. Complete the shape by connecting to the first point.' 
                : 'Drag the points to adjust the field boundary. Add new points by clicking on the boundary lines.'}
            </div>
          </div>
          
          {coordinates.length > 0 && fieldArea > 0 && (
            <div className="field-summary">
              <div className="field-summary-item">
                <span className="field-summary-label">
                  <FontAwesomeIcon icon={faMapMarkerAlt} /> Points:
                </span>
                <span className="field-summary-value">{coordinates.length}</span>
              </div>
              <div className="field-summary-item">
                <span className="field-summary-label">
                  <FontAwesomeIcon icon={faRulerCombined} /> Area:
                </span>
                <span className="field-summary-value">
                  {fieldArea.toFixed(2)} hectares
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="field-mapper-sidebar">
          <div className="field-details field-info-card">
            <div className="field-info-header">
              <FontAwesomeIcon icon={faInfoCircle} className="field-info-icon" />
              <h3>Field Information</h3>
            </div>
            
            <div className="field-form">
              <div className="form-group required form-group-animated">
                <label htmlFor="fieldNameInput">
                  <FontAwesomeIcon icon={faTag} />
                  Field Name <span className="required-star">*</span>
                </label>
                <input 
                  type="text" 
                  id="fieldNameInput" 
                  className={`form-control ${loading ? 'form-loading' : ''}`}
                  placeholder="Enter Field Name (e.g. North Plot)"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  disabled={loading}
                />
                <div className="form-help-text">
                  Give your field a unique, recognizable name
                </div>
              </div>
              
              <div className="form-group required form-group-animated">
                <label htmlFor="fieldLocation">
                  <FontAwesomeIcon icon={faLocationDot} />
                  Location <span className="required-star">*</span>
                </label>
                <div className="input-with-icon">
                  <input 
                    type="text" 
                    id="fieldLocation" 
                    className={`form-control ${loading ? 'form-loading' : ''}`}
                    placeholder="Field Location (e.g. Nashik, Maharashtra)"
                    value={fieldLocation}
                    onChange={(e) => setFieldLocation(e.target.value)}
                    disabled={loading}
                  />
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="input-icon" />
                </div>
                <div className="form-help-text">
                  Enter a descriptive location for your field
                </div>
              </div>

              <div className="form-group required form-group-animated">
                <label htmlFor="cropSelect">
                  <FontAwesomeIcon icon={faSeedling} />
                  Select Crop <span className="required-star">*</span>
                </label>
                <div className="custom-select-wrapper">
                  <select
                    id="cropSelect"
                    className={`form-control custom-select ${loading ? 'form-loading' : ''}`}
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">-- Select Crop --</option>
                    {cropOptions.map((crop) => (
                      <option key={crop} value={crop}>
                        {crop}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-help-text">
                  Select the crop you are planning to grow in this field
                </div>
              </div>
            </div>
          </div>
          
          {coordinates.length > 0 && (
            <div className="field-details">
              <h3>
                <FontAwesomeIcon icon={faLayerGroup} />
                Field Boundary
              </h3>
              
              <div className="field-summary">
                <div className="field-summary-item">
                  <span className="field-summary-label">
                    <FontAwesomeIcon icon={faMapMarkerAlt} /> Boundary Points
                  </span>
                  <span className="field-summary-value">{coordinates.length}</span>
                </div>
                <div className="field-summary-item">
                  <span className="field-summary-label">
                    <FontAwesomeIcon icon={faRulerCombined} /> Field Area
                  </span>
                  <span className="field-summary-value">
                    {fieldArea.toFixed(2)} ha
                  </span>
                </div>
              </div>
              
              <div className="coordinates-table">
                <h4>
                  <FontAwesomeIcon icon={faMapPin} />
                  GPS Coordinates
                </h4>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Point</th>
                        <th>Latitude</th>
                        <th>Longitude</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coordinates.map((point, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{point.lat.toFixed(6)}</td>
                          <td>{point.lng.toFixed(6)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="sticky-action-bar">
                <div className="button-group button-group-spaced">
                  <button 
                    className="btn btn-save btn-animated" 
                    onClick={handleSaveField}
                    disabled={loading || coordinates.length < 3 || !fieldName || !selectedCrop}
                  >
                    <FontAwesomeIcon icon={loading ? faSpinner : faSave} className={loading ? 'fa-spin' : ''} />
                    {loading ? 'Saving...' : 'Save Field'}
                  </button>
                  
                  <button 
                    className="btn btn-clear" 
                    onClick={handleClearAll}
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon={faEraser} />
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {message.show && (
        <div className={`alert alert-${message.type}`}>
          {message.type === 'error' && (
            <FontAwesomeIcon icon={faExclamationTriangle} />
          )}
          {message.type === 'success' && (
            <FontAwesomeIcon icon={faCheckCircle} />
          )}
          {message.type === 'info' && (
            <FontAwesomeIcon icon={faInfoCircle} />
          )}
          {message.text}
          <button 
            className="alert-close" 
            onClick={() => setMessage({ show: false, text: '', type: 'info' })}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
};

// Helper function to calculate polygon area in hectares
const calculatePolygonArea = (coordinates) => {
  if (!coordinates || coordinates.length < 3) return 0;

  // Implementation of the Shoelace formula to calculate polygon area
  let area = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    area += coordinates[i].lat * coordinates[j].lng;
    area -= coordinates[j].lat * coordinates[i].lng;
  }

  area = Math.abs(area) / 2;
  
  // Convert square degrees to hectares
  const degreeToMeter = 111319.9; // At equator, varies by latitude
  const squareMetersToHectares = 0.0001;
  
  return area * Math.pow(degreeToMeter, 2) * squareMetersToHectares;
};

export default FieldMapper;
