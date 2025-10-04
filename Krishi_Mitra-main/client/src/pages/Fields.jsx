import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMap, faEdit, faTrash, faSearch, faExclamationTriangle, faSpinner, faTimes, faSeedling } from '@fortawesome/free-solid-svg-icons';
import { getUserFields, deleteField } from '../services/dataService';
import '../components/fields/Fields.css';

const Fields = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc',
  });

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getUserFields();
      
      // Check if the response is successful and contains data
      if (result.success && Array.isArray(result.data)) {
        // Map the MongoDB field data to the expected format
        const mappedFields = result.data.map(field => ({
          id: field._id,
          name: field.field_name,
          location: field.field_name, // Using field_name as location since we don't have separate location field
          crop: field.current_crop || 'Not specified',
          area: field.area || 0,
          soilType: field.soil_type || 'Unknown',
          createdAt: field.created_at,
          coordinates: field.coordinates || [],
          soilParameters: field.soil_parameters || {},
          weatherData: field.weather_data || {},
          status: field.status || 'active'
        }));
        setFields(mappedFields);
      } else {
        // If no data or unsuccessful response, show empty fields list
        setFields([]);
        if (!result.success) {
          setError(result.error || 'Failed to load fields from database');
        }
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
      // Set empty array instead of dummy data when there's an error
      setFields([]);
      setError(`Failed to connect to server: ${error.message}. Please check if the Flask server is running.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteField = async (fieldId) => {
    if (!fieldId) return;
    
    try {
      const result = await deleteField(fieldId);
      
      if (result.success) {
        // Remove the deleted field from the state
        setFields(fields.filter(field => field.id !== fieldId));
        
        // Clear delete confirmation
        setDeleteConfirm(null);
        
        // Show success message (optional)
        console.log('Field deleted successfully:', result.message);
      } else {
        throw new Error(result.error || 'Failed to delete field');
      }
    } catch (error) {
      console.error('Error deleting field:', error);
      setError(`Failed to delete field: ${error.message}`);
    }
  };

  const requestDelete = (fieldId) => {
    setDeleteConfirm(fieldId);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter fields based on search term
  const filteredFields = fields.filter(field => 
    field.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (field.soilType && field.soilType.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (field.status && field.status.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort fields based on sortConfig
  const sortedFields = [...filteredFields].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? '↑' : '↓';
    }
    return null;
  };

  return (
    <div className="fields-page bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
            <FontAwesomeIcon icon={faMap} className="mr-2 sm:mr-3 text-green-600 text-lg sm:text-xl" />
            Manage Fields
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            View and manage your field maps stored in the database
          </p>
        </div>
        <Link 
          to="/create-field" 
          className="btn bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center transition-colors w-full sm:w-auto text-sm sm:text-base font-medium"
        >
          <span className="mr-2">+</span> Add New Field
        </Link>
      </div>

      {/* Search and filter */}
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FontAwesomeIcon icon={faSearch} className="text-gray-400 text-sm sm:text-base" />
          </div>
          <input
            type="text"
            placeholder="Search by field name, location, or crop..."
            className="pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 sm:p-4 mb-4 sm:mb-6 rounded-lg flex items-start sm:items-center text-sm sm:text-base">
          <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 flex-shrink-0 mt-0.5 sm:mt-0" />
          <span className="break-words">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 sm:py-12">
          <FontAwesomeIcon icon={faSpinner} spin className="text-3xl sm:text-4xl text-green-600 mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-600">Loading fields...</p>
        </div>
      ) : (
        <>
          {filteredFields.length === 0 ? (
            <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <FontAwesomeIcon icon={faMap} className="text-3xl sm:text-4xl text-gray-400 mb-3" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-700">No fields found</h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base px-4">
                {searchTerm ? 'No fields match your search criteria' : 'You haven\'t created any fields yet'}
              </p>
              {searchTerm && (
                <button 
                  className="text-green-600 hover:text-green-700 font-medium text-sm sm:text-base"
                  onClick={() => setSearchTerm('')}
                >
                  Clear search
                </button>
              )}
              {!searchTerm && (
                <Link 
                  to="/create-field" 
                  className="inline-block bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors text-sm sm:text-base"
                >
                  Create your first field
                </Link>
              )}
            </div>
          ) : (
            <>
            {/* Mobile Card View */}
            <div className="block md:hidden space-y-4">
              {sortedFields.map((field) => (
                <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{field.name}</h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Soil Type:</span>
                          <span className="text-gray-900">{field.soilType || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Area:</span>
                          <span className="text-gray-900">{field.area ? field.area.toFixed(2) + ' ha' : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Created:</span>
                          <span className="text-gray-900">{field.createdAt ? new Date(field.createdAt).toLocaleDateString() : 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Status:</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            field.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {field.status === 'active' ? 'Active' : field.status || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <div className="flex space-x-4">
                      <Link
                        to={`/field-detail/${field.id}`}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        title="View field details"
                      >
                        View
                      </Link>
                      <Link
                        to={`/field-detail/${field.id}`}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                        title="Edit field"
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-1" />
                        Edit
                      </Link>
                    </div>
                    
                    <div>
                      {deleteConfirm === field.id ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDeleteField(field.id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                            title="Confirm delete"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={cancelDelete}
                            className="text-gray-600 hover:text-gray-900 text-sm"
                            title="Cancel delete"
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => requestDelete(field.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                          title="Delete field"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 border-b border-gray-200 text-gray-500 font-medium text-sm tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                      Field Name {getSortIcon('name')}
                    </th>
                    <th className="px-4 lg:px-6 py-3 border-b border-gray-200 text-gray-500 font-medium text-sm tracking-wider cursor-pointer" onClick={() => handleSort('soilType')}>
                      Soil Type {getSortIcon('soilType')}
                    </th>
                    <th className="px-4 lg:px-6 py-3 border-b border-gray-200 text-gray-500 font-medium text-sm tracking-wider cursor-pointer" onClick={() => handleSort('area')}>
                      Area (ha) {getSortIcon('area')}
                    </th>
                    <th className="px-4 lg:px-6 py-3 border-b border-gray-200 text-gray-500 font-medium text-sm tracking-wider cursor-pointer" onClick={() => handleSort('createdAt')}>
                      Created Date {getSortIcon('createdAt')}
                    </th>
                    <th className="px-4 lg:px-6 py-3 border-b border-gray-200 text-gray-500 font-medium text-sm tracking-wider">
                      Status
                    </th>
                    <th className="px-4 lg:px-6 py-3 border-b border-gray-200 text-gray-500 font-medium text-sm tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFields.map((field) => (
                    <tr key={field.id} className="hover:bg-gray-50">
                      <td className="px-4 lg:px-6 py-4 border-b border-gray-200">
                        <div className="font-medium text-gray-900">{field.name}</div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 border-b border-gray-200 text-gray-500">
                        {field.soilType || 'Unknown'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 border-b border-gray-200 text-gray-500">
                        {field.area ? field.area.toFixed(2) : 'N/A'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 border-b border-gray-200 text-gray-500">
                        {field.createdAt ? new Date(field.createdAt).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 border-b border-gray-200">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          field.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {field.status === 'active' ? 'Active' : field.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 border-b border-gray-200 text-right">
                        <div className="flex justify-end items-center space-x-3">
                          <Link
                            to={`/field-detail/${field.id}`}
                            className="text-indigo-600 hover:text-indigo-900 text-sm"
                            title="View field details"
                          >
                            View
                          </Link>
                          <Link
                            to={`/field-detail/${field.id}`}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit field"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Link>
                          {deleteConfirm === field.id ? (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleDeleteField(field.id)}
                                className="text-red-600 hover:text-red-900 text-sm"
                                title="Confirm delete"
                              >
                                Yes
                              </button>
                              <button
                                onClick={cancelDelete}
                                className="text-gray-600 hover:text-gray-900"
                                title="Cancel delete"
                              >
                                <FontAwesomeIcon icon={faTimes} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => requestDelete(field.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete field"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

// Helper function to calculate approximate field area in hectares
function calculateFieldArea(coordinates) {
  if (!coordinates || coordinates.length < 3) return 0;

  // Implementation of the Shoelace formula to calculate polygon area
  let area = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    area += coordinates[i].lat * coordinates[j].lng;
    area -= coordinates[j].lat * coordinates[i].lng;
  }

  area = Math.abs(area) / 2;
  
  // Convert square degrees to hectares (very approximate, varies by latitude)
  // This is a rough approximation, for more precise calculation, use proper GIS libraries
  const degreeToMeter = 111319.9; // At equator, varies by latitude
  const squareMetersToHectares = 0.0001;
  
  return area * Math.pow(degreeToMeter, 2) * squareMetersToHectares;
}

export default Fields;
