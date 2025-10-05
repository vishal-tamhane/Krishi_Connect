const express = require('express');
const router = express.Router();
const climateClaimService = require('../services/climateClaimService');
const { authenticateToken, farmerOnly, governmentOnly } = require('../middleware/auth');
const { validateClimateClaimCreation } = require('../middleware/validation');
const { logger } = require('../config/database');

/**
 * @route POST /api/climate-damage-claims
 * @desc Create a new climate damage claim
 * @access Private (Farmers only)
 */
router.post('/', authenticateToken, farmerOnly, validateClimateClaimCreation, async (req, res) => {
  try {
    const claim = await climateClaimService.createClimateClaimDamage(req.user.id, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Climate damage claim submitted successfully',
      data: { claim },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Create climate claim error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_CLAIM_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * @route GET /api/climate-damage-claims
 * @desc Get all climate damage claims for current user
 * @access Private (Farmers only)
 */
router.get('/', authenticateToken, farmerOnly, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const claims = await climateClaimService.getUserClaims(req.user.id, limit);
    
    res.json({
      success: true,
      data: { 
        claims,
        count: claims.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get climate claims error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_CLAIMS_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * @route GET /api/climate-damage-claims/:claimId
 * @desc Get a specific climate damage claim by ID
 * @access Private (Farmers only)
 */
router.get('/:claimId', authenticateToken, farmerOnly, async (req, res) => {
  try {
    const { claimId } = req.params;
    const claim = await climateClaimService.getClaimById(claimId, req.user.id);
    
    if (!claim) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CLAIM_NOT_FOUND',
          message: 'Climate damage claim not found or access denied',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    res.json({
      success: true,
      data: { claim },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get climate claim by ID error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_CLAIM_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * @route GET /api/climate-damage-claims/government/all
 * @desc Get all climate damage claims for government review
 * @access Private (Government only)
 */
router.get('/government/all', authenticateToken, governmentOnly, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    // Extract filters from query parameters
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.damage_type) filters.damage_type = req.query.damage_type;
    if (req.query.severity_level) filters.severity_level = req.query.severity_level;
    if (req.query.date_from) filters.date_from = req.query.date_from;
    if (req.query.date_to) filters.date_to = req.query.date_to;
    
    const claims = await climateClaimService.getAllClaimsForGovernment(filters, limit);
    
    res.json({
      success: true,
      data: { 
        claims,
        count: claims.length,
        filters_applied: filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get government claims error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_GOVERNMENT_CLAIMS_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * @route GET /api/climate-damage-claims/government/:claimId
 * @desc Get a specific claim for government review (without user restriction)
 * @access Private (Government only)
 */
router.get('/government/:claimId', authenticateToken, governmentOnly, async (req, res) => {
  try {
    const { claimId } = req.params;
    
    // For government, we don't restrict by user_id, so we pass null as userId
    const query = `
      SELECT 
        c.*,
        f.field_name, f.coordinates as field_coordinates,
        cr.crop_name,
        u.name as user_name, u.email as user_email
      FROM climate_damage_claims c
      LEFT JOIN fields f ON c.field_id = f.id
      LEFT JOIN crops cr ON c.crop_id = cr.id
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `;

    const { db } = require('../config/database');
    const result = await db.query(query, [claimId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CLAIM_NOT_FOUND',
          message: 'Climate damage claim not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    const claim = result.rows[0];
    
    const formattedClaim = {
      id: claim.id,
      claim_reference_number: claim.claim_reference_number,
      field_name: claim.field_name,
      crop_name: claim.crop_name,
      user_details: {
        name: claim.user_name,
        email: claim.user_email
      },
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
    
    res.json({
      success: true,
      data: { claim: formattedClaim },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get government claim by ID error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_GOVERNMENT_CLAIM_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * @route PUT /api/climate-damage-claims/government/:claimId/status
 * @desc Update claim status (Government only)
 * @access Private (Government only)
 */
router.put('/government/:claimId/status', authenticateToken, governmentOnly, async (req, res) => {
  try {
    const { claimId } = req.params;
    const { claim_status, government_notes, approved_amount } = req.body;

    // Validate claim status
    const validStatuses = ['submitted', 'under_review', 'approved', 'rejected', 'completed'];
    if (!claim_status || !validStatuses.includes(claim_status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Status must be one of: ${validStatuses.join(', ')}`,
          timestamp: new Date().toISOString()
        }
      });
    }

    // If approving, approved amount is required
    if (claim_status === 'approved' && !approved_amount) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'APPROVED_AMOUNT_REQUIRED',
          message: 'Approved amount is required when approving a claim',
          timestamp: new Date().toISOString()
        }
      });
    }

    const updatedClaim = await climateClaimService.updateClaimStatus(
      claimId, 
      { claim_status, government_notes, approved_amount }, 
      req.user.email
    );
    
    res.json({
      success: true,
      message: 'Claim status updated successfully',
      data: { claim: updatedClaim },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Update claim status error:', error);
    
    let statusCode = 500;
    let errorCode = 'UPDATE_STATUS_FAILED';
    
    if (error.message.includes('not found')) {
      statusCode = 404;
      errorCode = 'CLAIM_NOT_FOUND';
    }
    
    res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * @route GET /api/climate-damage-claims/statistics/summary
 * @desc Get claim statistics for dashboard
 * @access Private (Both farmers and government)
 */
router.get('/statistics/summary', authenticateToken, async (req, res) => {
  try {
    // For farmers, get their statistics only. For government, get all statistics
    const userId = req.user.user_type === 'farmer' ? req.user.id : null;
    const statistics = await climateClaimService.getClaimStatistics(userId);
    
    res.json({
      success: true,
      data: { statistics },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get claim statistics error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_STATISTICS_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;