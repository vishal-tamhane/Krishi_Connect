const { db, logger } = require('../config/database');

class FieldService {
  /**
   * Create a new field
   */
  async createField(userId, fieldData) {
    try {
      const {
        field_name,
        coordinates,
        area_hectares,
        soil_type,
        elevation,
        slope_percentage,
        drainage_type,
        soil_nitrogen,
        soil_phosphorus,
        soil_potassium,
        soil_ph,
        organic_matter_percentage,
        soil_moisture_percentage,
        average_temperature,
        annual_rainfall,
        average_humidity
      } = fieldData;

      const query = `
        INSERT INTO fields (
          user_id, field_name, coordinates, area_hectares, soil_type,
          elevation, slope_percentage, drainage_type,
          soil_nitrogen, soil_phosphorus, soil_potassium, soil_ph,
          organic_matter_percentage, soil_moisture_percentage,
          average_temperature, annual_rainfall, average_humidity
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id, field_name, area_hectares, created_at
      `;

      const values = [
        userId,
        field_name,
        JSON.stringify(coordinates),
        area_hectares,
        soil_type,
        elevation,
        slope_percentage,
        drainage_type,
        soil_nitrogen,
        soil_phosphorus,
        soil_potassium,
        soil_ph,
        organic_matter_percentage,
        soil_moisture_percentage,
        average_temperature,
        annual_rainfall,
        average_humidity
      ];

      const result = await db.query(query, values);
      const field = result.rows[0];

      logger.info(`Field created successfully: ${field_name} for user ${userId}`);

      return {
        id: field.id,
        field_name: field.field_name,
        area_hectares: parseFloat(field.area_hectares),
        created_at: field.created_at
      };
    } catch (error) {
      logger.error('Error creating field:', error);
      throw new Error(`Failed to create field: ${error.message}`);
    }
  }

  /**
   * Get all fields for a user
   */
  async getUserFields(userId, limit = 50) {
    try {
      const query = `
        SELECT 
          id, field_name, coordinates, area_hectares, soil_type,
          elevation, soil_nitrogen, soil_phosphorus, soil_potassium, soil_ph,
          average_temperature, annual_rainfall, status, created_at, updated_at
        FROM fields 
        WHERE user_id = $1 AND status = 'active'
        ORDER BY created_at DESC
        LIMIT $2
      `;

      const result = await db.query(query, [userId, limit]);
      
      const fields = result.rows.map(field => ({
        id: field.id,
        field_name: field.field_name,
        coordinates: typeof field.coordinates === 'string' 
          ? JSON.parse(field.coordinates) 
          : field.coordinates,
        area_hectares: parseFloat(field.area_hectares),
        soil_type: field.soil_type,
        elevation: field.elevation ? parseFloat(field.elevation) : null,
        soil_nitrogen: field.soil_nitrogen ? parseFloat(field.soil_nitrogen) : null,
        soil_phosphorus: field.soil_phosphorus ? parseFloat(field.soil_phosphorus) : null,
        soil_potassium: field.soil_potassium ? parseFloat(field.soil_potassium) : null,
        soil_ph: field.soil_ph ? parseFloat(field.soil_ph) : null,
        average_temperature: field.average_temperature ? parseFloat(field.average_temperature) : null,
        annual_rainfall: field.annual_rainfall ? parseFloat(field.annual_rainfall) : null,
        status: field.status,
        created_at: field.created_at,
        updated_at: field.updated_at
      }));

      logger.info(`Retrieved ${fields.length} fields for user ${userId}`);
      return fields;
    } catch (error) {
      logger.error('Error getting user fields:', error);
      throw new Error(`Failed to get fields: ${error.message}`);
    }
  }

  /**
   * Get field by ID (with user ownership check)
   */
  async getFieldById(fieldId, userId) {
    try {
      const query = `
        SELECT 
          id, field_name, coordinates, area_hectares, soil_type,
          elevation, slope_percentage, drainage_type,
          soil_nitrogen, soil_phosphorus, soil_potassium, soil_ph,
          organic_matter_percentage, soil_moisture_percentage,
          average_temperature, annual_rainfall, average_humidity,
          status, created_at, updated_at
        FROM fields 
        WHERE id = $1 AND user_id = $2 AND status = 'active'
      `;

      const result = await db.query(query, [fieldId, userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const field = result.rows[0];

      return {
        id: field.id,
        field_name: field.field_name,
        coordinates: typeof field.coordinates === 'string' 
          ? JSON.parse(field.coordinates) 
          : field.coordinates,
        area_hectares: parseFloat(field.area_hectares),
        soil_type: field.soil_type,
        elevation: field.elevation ? parseFloat(field.elevation) : null,
        slope_percentage: field.slope_percentage ? parseFloat(field.slope_percentage) : null,
        drainage_type: field.drainage_type,
        soil_nitrogen: field.soil_nitrogen ? parseFloat(field.soil_nitrogen) : null,
        soil_phosphorus: field.soil_phosphorus ? parseFloat(field.soil_phosphorus) : null,
        soil_potassium: field.soil_potassium ? parseFloat(field.soil_potassium) : null,
        soil_ph: field.soil_ph ? parseFloat(field.soil_ph) : null,
        organic_matter_percentage: field.organic_matter_percentage ? parseFloat(field.organic_matter_percentage) : null,
        soil_moisture_percentage: field.soil_moisture_percentage ? parseFloat(field.soil_moisture_percentage) : null,
        average_temperature: field.average_temperature ? parseFloat(field.average_temperature) : null,
        annual_rainfall: field.annual_rainfall ? parseFloat(field.annual_rainfall) : null,
        average_humidity: field.average_humidity ? parseFloat(field.average_humidity) : null,
        status: field.status,
        created_at: field.created_at,
        updated_at: field.updated_at
      };
    } catch (error) {
      logger.error('Error getting field by ID:', error);
      throw new Error(`Failed to get field: ${error.message}`);
    }
  }

  /**
   * Update field information
   */
  async updateField(fieldId, userId, updateData) {
    try {
      const allowedFields = [
        'field_name', 'coordinates', 'area_hectares', 'soil_type', 'elevation',
        'slope_percentage', 'drainage_type', 'soil_nitrogen', 'soil_phosphorus',
        'soil_potassium', 'soil_ph', 'organic_matter_percentage', 'soil_moisture_percentage',
        'average_temperature', 'annual_rainfall', 'average_humidity'
      ];

      const updateFields = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          if (key === 'coordinates') {
            updateFields.push(`${key} = $${paramCount}`);
            values.push(JSON.stringify(value));
          } else {
            updateFields.push(`${key} = $${paramCount}`);
            values.push(value);
          }
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(fieldId, userId);

      const query = `
        UPDATE fields 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount} AND user_id = $${paramCount + 1} AND status = 'active'
        RETURNING id, field_name, area_hectares, updated_at
      `;

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Field not found or access denied');
      }

      const field = result.rows[0];
      logger.info(`Field updated successfully: ${fieldId}`);

      return {
        id: field.id,
        field_name: field.field_name,
        area_hectares: parseFloat(field.area_hectares),
        updated_at: field.updated_at
      };
    } catch (error) {
      logger.error('Error updating field:', error);
      throw new Error(`Failed to update field: ${error.message}`);
    }
  }

  /**
   * Delete field (soft delete)
   */
  async deleteField(fieldId, userId) {
    try {
      const query = `
        UPDATE fields 
        SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2 AND status = 'active'
        RETURNING id, field_name
      `;

      const result = await db.query(query, [fieldId, userId]);

      if (result.rows.length === 0) {
        throw new Error('Field not found or access denied');
      }

      const field = result.rows[0];
      logger.info(`Field deleted successfully: ${fieldId}`);

      return {
        id: field.id,
        field_name: field.field_name,
        deleted: true
      };
    } catch (error) {
      logger.error('Error deleting field:', error);
      throw new Error(`Failed to delete field: ${error.message}`);
    }
  }

  /**
   * Get field statistics for dashboard
   */
  async getFieldStatistics(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_fields,
          SUM(area_hectares) as total_area,
          AVG(area_hectares) as average_area,
          COUNT(CASE WHEN soil_ph IS NOT NULL THEN 1 END) as fields_with_soil_data
        FROM fields 
        WHERE user_id = $1 AND status = 'active'
      `;

      const result = await db.query(query, [userId]);
      const stats = result.rows[0];

      return {
        total_fields: parseInt(stats.total_fields),
        total_area: stats.total_area ? parseFloat(stats.total_area) : 0,
        average_area: stats.average_area ? parseFloat(stats.average_area) : 0,
        fields_with_soil_data: parseInt(stats.fields_with_soil_data)
      };
    } catch (error) {
      logger.error('Error getting field statistics:', error);
      throw new Error(`Failed to get field statistics: ${error.message}`);
    }
  }
}

module.exports = new FieldService();