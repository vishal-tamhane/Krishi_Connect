const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { db, logger } = require('../config/database');

class ClimateClaimService {
  /**
   * Create a new climate damage claim
   */
  async createClimateClaimDamage(userId, claimData) {
    try {
      const {
        field_id,
        crop_id,
        farmer_name,
        farmer_email,
        farmer_phone,
        farm_location,
        farmer_address,
        incident_date,
        damage_type,
        crop_type,
        affected_area_hectares,
        estimated_loss_amount,
        severity_level,
        damage_description,
        weather_condition,
        damage_duration,
        selected_scheme_id,
        scheme_name,
        claim_amount,
        uploaded_photos,
        supporting_documents
      } = claimData;

      // Generate unique claim reference number
      const claimRef = `CLM${moment().format('YYYYMMDD')}${uuidv4().slice(0, 8).toUpperCase()}`;

      const query = `
        INSERT INTO climate_damage_claims (
          user_id, field_id, crop_id, farmer_name, farmer_email, farmer_phone,
          farm_location, farmer_address, incident_date, damage_type, crop_type,
          affected_area_hectares, estimated_loss_amount, severity_level,
          damage_description, weather_condition, damage_duration,
          selected_scheme_id, scheme_name, claim_amount, uploaded_photos,
          supporting_documents, claim_reference_number
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        RETURNING id, claim_reference_number, claim_status, created_at
      `;

      const values = [
        userId, field_id, crop_id, farmer_name, farmer_email, farmer_phone,
        farm_location, farmer_address, incident_date, damage_type, crop_type,
        affected_area_hectares, estimated_loss_amount, severity_level,
        damage_description, weather_condition, damage_duration,
        selected_scheme_id, scheme_name, claim_amount,
        JSON.stringify(uploaded_photos || []),
        JSON.stringify(supporting_documents || []),
        claimRef
      ];

      const result = await db.query(query, values);
      const claim = result.rows[0];

      logger.info(`Climate damage claim created: ${claimRef} for user ${userId}`);

      return {
        id: claim.id,
        claim_reference_number: claim.claim_reference_number,
        claim_status: claim.claim_status,
        created_at: claim.created_at,
        estimated_processing_time: '7-14 working days'
      };
    } catch (error) {
      logger.error('Error creating climate damage claim:', error);
      throw new Error(`Failed to create climate damage claim: ${error.message}`);
    }
  }

  /**
   * Get all claims for a user
   */
  async getUserClaims(userId, limit = 50) {
    try {
      const query = `
        SELECT 
          c.id, c.claim_reference_number, c.farmer_name, c.incident_date,
          c.damage_type, c.crop_type, c.affected_area_hectares,
          c.estimated_loss_amount, c.severity_level, c.claim_status,
          c.scheme_name, c.claim_amount, c.approved_amount,
          c.created_at, c.updated_at,
          f.field_name
        FROM climate_damage_claims c
        LEFT JOIN fields f ON c.field_id = f.id
        WHERE c.user_id = $1
        ORDER BY c.created_at DESC
        LIMIT $2
      `;

      const result = await db.query(query, [userId, limit]);
      
      const claims = result.rows.map(claim => ({
        id: claim.id,
        claim_reference_number: claim.claim_reference_number,
        farmer_name: claim.farmer_name,
        field_name: claim.field_name,
        incident_date: claim.incident_date,
        damage_type: claim.damage_type,
        crop_type: claim.crop_type,
        affected_area_hectares: parseFloat(claim.affected_area_hectares),
        estimated_loss_amount: parseFloat(claim.estimated_loss_amount),
        severity_level: claim.severity_level,
        claim_status: claim.claim_status,
        scheme_name: claim.scheme_name,
        claim_amount: claim.claim_amount ? parseFloat(claim.claim_amount) : null,
        approved_amount: claim.approved_amount ? parseFloat(claim.approved_amount) : null,
        created_at: claim.created_at,
        updated_at: claim.updated_at
      }));

      logger.info(`Retrieved ${claims.length} claims for user ${userId}`);
      return claims;
    } catch (error) {
      logger.error('Error getting user claims:', error);
      throw new Error(`Failed to get claims: ${error.message}`);
    }
  }

  /**
   * Get claim by ID
   */
  async getClaimById(claimId, userId) {
    try {
      const query = `
        SELECT 
          c.*,
          f.field_name, f.coordinates as field_coordinates,
          cr.crop_name
        FROM climate_damage_claims c
        LEFT JOIN fields f ON c.field_id = f.id
        LEFT JOIN crops cr ON c.crop_id = cr.id
        WHERE c.id = $1 AND c.user_id = $2
      `;

      const result = await db.query(query, [claimId, userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const claim = result.rows[0];

      return {
        id: claim.id,
        claim_reference_number: claim.claim_reference_number,
        field_name: claim.field_name,
        crop_name: claim.crop_name,
        farmer_details: {
          name: claim.farmer_name,
          email: claim.farmer_email,
          phone: claim.farmer_phone,
          location: claim.farm_location,
          address: claim.farmer_address
        },
        incident_details: {
          date: claim.incident_date,
          damage_type: claim.damage_type,
          crop_type: claim.crop_type,
          affected_area_hectares: parseFloat(claim.affected_area_hectares),
          severity_level: claim.severity_level,
          description: claim.damage_description,
          weather_condition: claim.weather_condition,
          damage_duration: claim.damage_duration
        },
        financial_details: {
          estimated_loss_amount: parseFloat(claim.estimated_loss_amount),
          selected_scheme_id: claim.selected_scheme_id,
          scheme_name: claim.scheme_name,
          claim_amount: claim.claim_amount ? parseFloat(claim.claim_amount) : null,
          approved_amount: claim.approved_amount ? parseFloat(claim.approved_amount) : null
        },
        documents: {
          uploaded_photos: typeof claim.uploaded_photos === 'string' 
            ? JSON.parse(claim.uploaded_photos) 
            : claim.uploaded_photos || [],
          supporting_documents: typeof claim.supporting_documents === 'string' 
            ? JSON.parse(claim.supporting_documents) 
            : claim.supporting_documents || []
        },
        status_info: {
          claim_status: claim.claim_status,
          government_notes: claim.government_notes,
          approval_date: claim.approval_date,
          payment_date: claim.payment_date
        },
        timestamps: {
          created_at: claim.created_at,
          updated_at: claim.updated_at
        }
      };
    } catch (error) {
      logger.error('Error getting claim by ID:', error);
      throw new Error(`Failed to get claim: ${error.message}`);
    }
  }

  /**
   * Update claim status (Government only)
   */
  async updateClaimStatus(claimId, statusData, updatedBy) {
    try {
      const {
        claim_status,
        government_notes,
        approved_amount
      } = statusData;

      const updateFields = ['claim_status = $2'];
      const values = [claimId, claim_status];
      let paramCount = 3;

      if (government_notes !== undefined) {
        updateFields.push(`government_notes = $${paramCount}`);
        values.push(government_notes);
        paramCount++;
      }

      if (approved_amount !== undefined) {
        updateFields.push(`approved_amount = $${paramCount}`);
        values.push(approved_amount);
        paramCount++;
      }

      if (claim_status === 'approved') {
        updateFields.push(`approval_date = CURRENT_DATE`);
      }

      const query = `
        UPDATE climate_damage_claims 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, claim_reference_number, claim_status, approved_amount
      `;

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Claim not found');
      }

      const claim = result.rows[0];
      logger.info(`Claim status updated: ${claimId} to ${claim_status} by ${updatedBy}`);

      return {
        id: claim.id,
        claim_reference_number: claim.claim_reference_number,
        claim_status: claim.claim_status,
        approved_amount: claim.approved_amount ? parseFloat(claim.approved_amount) : null
      };
    } catch (error) {
      logger.error('Error updating claim status:', error);
      throw new Error(`Failed to update claim status: ${error.message}`);
    }
  }

  /**
   * Get all claims for government review
   */
  async getAllClaimsForGovernment(filters = {}, limit = 50) {
    try {
      let whereConditions = [];
      let values = [];
      let paramCount = 1;

      // Apply filters
      if (filters.status) {
        whereConditions.push(`c.claim_status = $${paramCount}`);
        values.push(filters.status);
        paramCount++;
      }

      if (filters.damage_type) {
        whereConditions.push(`c.damage_type ILIKE $${paramCount}`);
        values.push(`%${filters.damage_type}%`);
        paramCount++;
      }

      if (filters.severity_level) {
        whereConditions.push(`c.severity_level = $${paramCount}`);
        values.push(filters.severity_level);
        paramCount++;
      }

      if (filters.date_from) {
        whereConditions.push(`c.incident_date >= $${paramCount}`);
        values.push(filters.date_from);
        paramCount++;
      }

      if (filters.date_to) {
        whereConditions.push(`c.incident_date <= $${paramCount}`);
        values.push(filters.date_to);
        paramCount++;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      values.push(limit);

      const query = `
        SELECT 
          c.id, c.claim_reference_number, c.farmer_name, c.farmer_email,
          c.farmer_phone, c.farm_location, c.incident_date, c.damage_type,
          c.crop_type, c.affected_area_hectares, c.estimated_loss_amount,
          c.severity_level, c.claim_status, c.scheme_name, c.claim_amount,
          c.approved_amount, c.created_at, c.updated_at,
          f.field_name,
          u.name as user_name, u.email as user_email
        FROM climate_damage_claims c
        LEFT JOIN fields f ON c.field_id = f.id
        LEFT JOIN users u ON c.user_id = u.id
        ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT $${paramCount}
      `;

      const result = await db.query(query, values);
      
      const claims = result.rows.map(claim => ({
        id: claim.id,
        claim_reference_number: claim.claim_reference_number,
        farmer_name: claim.farmer_name,
        farmer_email: claim.farmer_email,
        farmer_phone: claim.farmer_phone,
        farm_location: claim.farm_location,
        field_name: claim.field_name,
        incident_date: claim.incident_date,
        damage_type: claim.damage_type,
        crop_type: claim.crop_type,
        affected_area_hectares: parseFloat(claim.affected_area_hectares),
        estimated_loss_amount: parseFloat(claim.estimated_loss_amount),
        severity_level: claim.severity_level,
        claim_status: claim.claim_status,
        scheme_name: claim.scheme_name,
        claim_amount: claim.claim_amount ? parseFloat(claim.claim_amount) : null,
        approved_amount: claim.approved_amount ? parseFloat(claim.approved_amount) : null,
        user_name: claim.user_name,
        user_email: claim.user_email,
        created_at: claim.created_at,
        updated_at: claim.updated_at
      }));

      logger.info(`Retrieved ${claims.length} claims for government review`);
      return claims;
    } catch (error) {
      logger.error('Error getting claims for government:', error);
      throw new Error(`Failed to get claims for government: ${error.message}`);
    }
  }

  /**
   * Get claim statistics
   */
  async getClaimStatistics(userId = null) {
    try {
      const userFilter = userId ? 'WHERE user_id = $1' : '';
      const values = userId ? [userId] : [];

      const query = `
        SELECT 
          COUNT(*) as total_claims,
          COUNT(CASE WHEN claim_status = 'submitted' THEN 1 END) as pending_claims,
          COUNT(CASE WHEN claim_status = 'under_review' THEN 1 END) as under_review_claims,
          COUNT(CASE WHEN claim_status = 'approved' THEN 1 END) as approved_claims,
          COUNT(CASE WHEN claim_status = 'rejected' THEN 1 END) as rejected_claims,
          SUM(estimated_loss_amount) as total_estimated_loss,
          SUM(approved_amount) as total_approved_amount,
          AVG(estimated_loss_amount) as avg_claim_amount
        FROM climate_damage_claims 
        ${userFilter}
      `;

      const result = await db.query(query, values);
      const stats = result.rows[0];

      return {
        total_claims: parseInt(stats.total_claims),
        pending_claims: parseInt(stats.pending_claims),
        under_review_claims: parseInt(stats.under_review_claims),
        approved_claims: parseInt(stats.approved_claims),
        rejected_claims: parseInt(stats.rejected_claims),
        total_estimated_loss: stats.total_estimated_loss ? parseFloat(stats.total_estimated_loss) : 0,
        total_approved_amount: stats.total_approved_amount ? parseFloat(stats.total_approved_amount) : 0,
        avg_claim_amount: stats.avg_claim_amount ? parseFloat(stats.avg_claim_amount) : 0
      };
    } catch (error) {
      logger.error('Error getting claim statistics:', error);
      throw new Error(`Failed to get claim statistics: ${error.message}`);
    }
  }
}

module.exports = new ClimateClaimService();