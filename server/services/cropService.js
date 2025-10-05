const { db, logger } = require('../config/database');

class CropService {
  /**
   * Create a new crop lifecycle
   */
  async createCropLifecycle(userId, cropData) {
    try {
      const {
        field_id,
        crop_name,
        crop_variety,
        sowing_date,
        expected_harvest_date,
        sowing_nitrogen,
        sowing_phosphorus,
        sowing_potassium,
        sowing_ph,
        sowing_temperature,
        sowing_humidity,
        sowing_rainfall,
        sowing_soil_moisture,
        irrigation_method
      } = cropData;

      const query = `
        INSERT INTO crops (
          user_id, field_id, crop_name, crop_variety, sowing_date,
          expected_harvest_date, sowing_nitrogen, sowing_phosphorus,
          sowing_potassium, sowing_ph, sowing_temperature,
          sowing_humidity, sowing_rainfall, sowing_soil_moisture,
          irrigation_method
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id, crop_name, crop_variety, sowing_date, current_stage, created_at
      `;

      const values = [
        userId, field_id, crop_name, crop_variety, sowing_date,
        expected_harvest_date, sowing_nitrogen, sowing_phosphorus,
        sowing_potassium, sowing_ph, sowing_temperature,
        sowing_humidity, sowing_rainfall, sowing_soil_moisture,
        irrigation_method || 'manual'
      ];

      const result = await db.query(query, values);
      const crop = result.rows[0];

      logger.info(`Crop lifecycle created: ${crop_name} for user ${userId}`);

      return {
        id: crop.id,
        crop_name: crop.crop_name,
        crop_variety: crop.crop_variety,
        sowing_date: crop.sowing_date,
        current_stage: crop.current_stage,
        created_at: crop.created_at
      };
    } catch (error) {
      logger.error('Error creating crop lifecycle:', error);
      throw new Error(`Failed to create crop lifecycle: ${error.message}`);
    }
  }

  /**
   * Get all crops for a user
   */
  async getUserCrops(userId, limit = 50) {
    try {
      const query = `
        SELECT 
          c.id, c.crop_name, c.crop_variety, c.sowing_date, c.expected_harvest_date,
          c.current_stage, c.crop_status, c.total_water_used, c.irrigation_method,
          c.created_at, c.updated_at,
          f.field_name, f.area_hectares
        FROM crops c
        JOIN fields f ON c.field_id = f.id
        WHERE c.user_id = $1 AND c.crop_status != 'deleted'
        ORDER BY c.created_at DESC
        LIMIT $2
      `;

      const result = await db.query(query, [userId, limit]);
      
      const crops = result.rows.map(crop => ({
        id: crop.id,
        crop_name: crop.crop_name,
        crop_variety: crop.crop_variety,
        sowing_date: crop.sowing_date,
        expected_harvest_date: crop.expected_harvest_date,
        current_stage: crop.current_stage,
        crop_status: crop.crop_status,
        total_water_used: crop.total_water_used ? parseFloat(crop.total_water_used) : 0,
        irrigation_method: crop.irrigation_method,
        field_name: crop.field_name,
        field_area: crop.area_hectares ? parseFloat(crop.area_hectares) : 0,
        created_at: crop.created_at,
        updated_at: crop.updated_at
      }));

      logger.info(`Retrieved ${crops.length} crops for user ${userId}`);
      return crops;
    } catch (error) {
      logger.error('Error getting user crops:', error);
      throw new Error(`Failed to get crops: ${error.message}`);
    }
  }

  /**
   * Get crop by ID
   */
  async getCropById(cropId, userId) {
    try {
      const query = `
        SELECT 
          c.*,
          f.field_name, f.area_hectares, f.coordinates
        FROM crops c
        JOIN fields f ON c.field_id = f.id
        WHERE c.id = $1 AND c.user_id = $2 AND c.crop_status != 'deleted'
      `;

      const result = await db.query(query, [cropId, userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const crop = result.rows[0];

      return {
        id: crop.id,
        field_id: crop.field_id,
        field_name: crop.field_name,
        field_area: crop.area_hectares ? parseFloat(crop.area_hectares) : 0,
        crop_name: crop.crop_name,
        crop_variety: crop.crop_variety,
        sowing_date: crop.sowing_date,
        expected_harvest_date: crop.expected_harvest_date,
        actual_harvest_date: crop.actual_harvest_date,
        current_stage: crop.current_stage,
        crop_status: crop.crop_status,
        total_water_used: crop.total_water_used ? parseFloat(crop.total_water_used) : 0,
        irrigation_method: crop.irrigation_method,
        total_nitrogen_applied: crop.total_nitrogen_applied ? parseFloat(crop.total_nitrogen_applied) : 0,
        total_phosphorus_applied: crop.total_phosphorus_applied ? parseFloat(crop.total_phosphorus_applied) : 0,
        total_potassium_applied: crop.total_potassium_applied ? parseFloat(crop.total_potassium_applied) : 0,
        sowing_conditions: {
          nitrogen: crop.sowing_nitrogen ? parseFloat(crop.sowing_nitrogen) : null,
          phosphorus: crop.sowing_phosphorus ? parseFloat(crop.sowing_phosphorus) : null,
          potassium: crop.sowing_potassium ? parseFloat(crop.sowing_potassium) : null,
          ph: crop.sowing_ph ? parseFloat(crop.sowing_ph) : null,
          temperature: crop.sowing_temperature ? parseFloat(crop.sowing_temperature) : null,
          humidity: crop.sowing_humidity ? parseFloat(crop.sowing_humidity) : null,
          rainfall: crop.sowing_rainfall ? parseFloat(crop.sowing_rainfall) : null,
          soil_moisture: crop.sowing_soil_moisture ? parseFloat(crop.sowing_soil_moisture) : null
        },
        created_at: crop.created_at,
        updated_at: crop.updated_at
      };
    } catch (error) {
      logger.error('Error getting crop by ID:', error);
      throw new Error(`Failed to get crop: ${error.message}`);
    }
  }

  /**
   * Add irrigation record
   */
  async addIrrigationRecord(cropId, userId, irrigationData) {
    try {
      const { irrigation_date, amount_mm, irrigation_method, duration_minutes, notes } = irrigationData;

      return await db.transaction(async (client) => {
        // First verify crop ownership
        const cropQuery = 'SELECT id FROM crops WHERE id = $1 AND user_id = $2';
        const cropResult = await client.query(cropQuery, [cropId, userId]);
        
        if (cropResult.rows.length === 0) {
          throw new Error('Crop not found or access denied');
        }

        // Insert irrigation record
        const insertQuery = `
          INSERT INTO irrigation_records (
            crop_id, irrigation_date, amount_mm, irrigation_method, duration_minutes, notes
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, irrigation_date, amount_mm
        `;

        const insertResult = await client.query(insertQuery, [
          cropId, irrigation_date, amount_mm, irrigation_method || 'manual', duration_minutes, notes
        ]);

        // Update crop total water used
        const updateQuery = `
          UPDATE crops 
          SET total_water_used = total_water_used + $1
          WHERE id = $2
        `;
        
        await client.query(updateQuery, [amount_mm, cropId]);

        const record = insertResult.rows[0];
        logger.info(`Irrigation record added for crop ${cropId}: ${amount_mm}mm`);

        return {
          id: record.id,
          irrigation_date: record.irrigation_date,
          amount_mm: parseFloat(record.amount_mm)
        };
      });
    } catch (error) {
      logger.error('Error adding irrigation record:', error);
      throw new Error(`Failed to add irrigation record: ${error.message}`);
    }
  }

  /**
   * Add fertilizer record
   */
  async addFertilizerRecord(cropId, userId, fertilizerData) {
    try {
      const { 
        application_date, 
        nutrient_type, 
        amount_kg_per_ha, 
        application_method, 
        fertilizer_name, 
        notes 
      } = fertilizerData;

      return await db.transaction(async (client) => {
        // First verify crop ownership
        const cropQuery = 'SELECT id FROM crops WHERE id = $1 AND user_id = $2';
        const cropResult = await client.query(cropQuery, [cropId, userId]);
        
        if (cropResult.rows.length === 0) {
          throw new Error('Crop not found or access denied');
        }

        // Insert fertilizer record
        const insertQuery = `
          INSERT INTO fertilizer_records (
            crop_id, application_date, nutrient_type, amount_kg_per_ha,
            application_method, fertilizer_name, notes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, application_date, nutrient_type, amount_kg_per_ha
        `;

        const insertResult = await client.query(insertQuery, [
          cropId, application_date, nutrient_type, amount_kg_per_ha,
          application_method, fertilizer_name, notes
        ]);

        // Update crop totals based on nutrient type
        let updateQuery;
        switch (nutrient_type.toUpperCase()) {
          case 'N':
            updateQuery = 'UPDATE crops SET total_nitrogen_applied = total_nitrogen_applied + $1 WHERE id = $2';
            break;
          case 'P':
            updateQuery = 'UPDATE crops SET total_phosphorus_applied = total_phosphorus_applied + $1 WHERE id = $2';
            break;
          case 'K':
            updateQuery = 'UPDATE crops SET total_potassium_applied = total_potassium_applied + $1 WHERE id = $2';
            break;
          case 'NPK':
            // For NPK, distribute equally (this is a simplification)
            const amountPerNutrient = amount_kg_per_ha / 3;
            await client.query('UPDATE crops SET total_nitrogen_applied = total_nitrogen_applied + $1 WHERE id = $2', [amountPerNutrient, cropId]);
            await client.query('UPDATE crops SET total_phosphorus_applied = total_phosphorus_applied + $1 WHERE id = $2', [amountPerNutrient, cropId]);
            await client.query('UPDATE crops SET total_potassium_applied = total_potassium_applied + $1 WHERE id = $2', [amountPerNutrient, cropId]);
            break;
        }

        if (updateQuery && nutrient_type.toUpperCase() !== 'NPK') {
          await client.query(updateQuery, [amount_kg_per_ha, cropId]);
        }

        const record = insertResult.rows[0];
        logger.info(`Fertilizer record added for crop ${cropId}: ${nutrient_type} ${amount_kg_per_ha}kg/ha`);

        return {
          id: record.id,
          application_date: record.application_date,
          nutrient_type: record.nutrient_type,
          amount_kg_per_ha: parseFloat(record.amount_kg_per_ha)
        };
      });
    } catch (error) {
      logger.error('Error adding fertilizer record:', error);
      throw new Error(`Failed to add fertilizer record: ${error.message}`);
    }
  }

  /**
   * Get irrigation records for a crop
   */
  async getIrrigationRecords(cropId, userId, limit = 50) {
    try {
      // First verify crop ownership
      const ownershipQuery = 'SELECT id FROM crops WHERE id = $1 AND user_id = $2';
      const ownershipResult = await db.query(ownershipQuery, [cropId, userId]);
      
      if (ownershipResult.rows.length === 0) {
        throw new Error('Crop not found or access denied');
      }

      const query = `
        SELECT id, irrigation_date, amount_mm, irrigation_method, duration_minutes, notes, recorded_at
        FROM irrigation_records 
        WHERE crop_id = $1
        ORDER BY irrigation_date DESC
        LIMIT $2
      `;

      const result = await db.query(query, [cropId, limit]);
      
      const records = result.rows.map(record => ({
        id: record.id,
        irrigation_date: record.irrigation_date,
        amount_mm: parseFloat(record.amount_mm),
        irrigation_method: record.irrigation_method,
        duration_minutes: record.duration_minutes,
        notes: record.notes,
        recorded_at: record.recorded_at
      }));

      return records;
    } catch (error) {
      logger.error('Error getting irrigation records:', error);
      throw new Error(`Failed to get irrigation records: ${error.message}`);
    }
  }

  /**
   * Get fertilizer records for a crop
   */
  async getFertilizerRecords(cropId, userId, limit = 50) {
    try {
      // First verify crop ownership
      const ownershipQuery = 'SELECT id FROM crops WHERE id = $1 AND user_id = $2';
      const ownershipResult = await db.query(ownershipQuery, [cropId, userId]);
      
      if (ownershipResult.rows.length === 0) {
        throw new Error('Crop not found or access denied');
      }

      const query = `
        SELECT id, application_date, nutrient_type, amount_kg_per_ha, 
               application_method, fertilizer_name, notes, recorded_at
        FROM fertilizer_records 
        WHERE crop_id = $1
        ORDER BY application_date DESC
        LIMIT $2
      `;

      const result = await db.query(query, [cropId, limit]);
      
      const records = result.rows.map(record => ({
        id: record.id,
        application_date: record.application_date,
        nutrient_type: record.nutrient_type,
        amount_kg_per_ha: parseFloat(record.amount_kg_per_ha),
        application_method: record.application_method,
        fertilizer_name: record.fertilizer_name,
        notes: record.notes,
        recorded_at: record.recorded_at
      }));

      return records;
    } catch (error) {
      logger.error('Error getting fertilizer records:', error);
      throw new Error(`Failed to get fertilizer records: ${error.message}`);
    }
  }

  /**
   * Update crop stage
   */
  async updateCropStage(cropId, userId, stage) {
    try {
      const query = `
        UPDATE crops 
        SET current_stage = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3
        RETURNING id, crop_name, current_stage
      `;

      const result = await db.query(query, [stage, cropId, userId]);

      if (result.rows.length === 0) {
        throw new Error('Crop not found or access denied');
      }

      const crop = result.rows[0];
      logger.info(`Crop stage updated: ${cropId} to ${stage}`);

      return {
        id: crop.id,
        crop_name: crop.crop_name,
        current_stage: crop.current_stage
      };
    } catch (error) {
      logger.error('Error updating crop stage:', error);
      throw new Error(`Failed to update crop stage: ${error.message}`);
    }
  }

  /**
   * Get crop statistics for dashboard
   */
  async getCropStatistics(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_crops,
          COUNT(CASE WHEN crop_status = 'active' THEN 1 END) as active_crops,
          COUNT(CASE WHEN crop_status = 'harvested' THEN 1 END) as harvested_crops,
          AVG(total_water_used) as avg_water_usage,
          SUM(total_water_used) as total_water_used
        FROM crops 
        WHERE user_id = $1 AND crop_status != 'deleted'
      `;

      const result = await db.query(query, [userId]);
      const stats = result.rows[0];

      return {
        total_crops: parseInt(stats.total_crops),
        active_crops: parseInt(stats.active_crops),
        harvested_crops: parseInt(stats.harvested_crops),
        avg_water_usage: stats.avg_water_usage ? parseFloat(stats.avg_water_usage) : 0,
        total_water_used: stats.total_water_used ? parseFloat(stats.total_water_used) : 0
      };
    } catch (error) {
      logger.error('Error getting crop statistics:', error);
      throw new Error(`Failed to get crop statistics: ${error.message}`);
    }
  }
}

module.exports = new CropService();