const express = require('express');
const router = express.Router();
const { db, logger } = require('../config/database');

/**
 * @route GET /api/government-schemes
 * @desc Get all active government schemes
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const { search, max_amount, scheme_type } = req.query;
    
    let whereConditions = ['is_active = true'];
    let values = [];
    let paramCount = 1;

    // Apply search filter
    if (search) {
      whereConditions.push(`(scheme_name ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    // Apply max amount filter
    if (max_amount) {
      whereConditions.push(`max_claim_amount <= $${paramCount}`);
      values.push(parseFloat(max_amount));
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const query = `
      SELECT 
        scheme_code, scheme_name, description, max_claim_amount,
        eligibility_criteria, application_process, required_documents,
        start_date, end_date
      FROM government_schemes 
      ${whereClause}
      ORDER BY max_claim_amount DESC
    `;

    const result = await db.query(query, values);
    
    const schemes = result.rows.map(scheme => ({
      id: scheme.scheme_code,
      name: scheme.scheme_name,
      description: scheme.description,
      max_amount: scheme.max_claim_amount ? `₹${parseFloat(scheme.max_claim_amount).toLocaleString('en-IN')}` : null,
      max_amount_numeric: scheme.max_claim_amount ? parseFloat(scheme.max_claim_amount) : null,
      eligibility: scheme.eligibility_criteria,
      application_process: scheme.application_process,
      required_documents: typeof scheme.required_documents === 'string' 
        ? JSON.parse(scheme.required_documents) 
        : scheme.required_documents || [],
      validity: {
        start_date: scheme.start_date,
        end_date: scheme.end_date,
        is_active: !scheme.end_date || new Date(scheme.end_date) > new Date()
      }
    }));
    
    res.json({
      success: true,
      data: { 
        schemes,
        count: schemes.length,
        filters_applied: {
          search: search || null,
          max_amount: max_amount || null,
          scheme_type: scheme_type || null
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get government schemes error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_SCHEMES_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * @route GET /api/government-schemes/:schemeCode
 * @desc Get specific government scheme details
 * @access Public
 */
router.get('/:schemeCode', async (req, res) => {
  try {
    const { schemeCode } = req.params;
    
    const query = `
      SELECT *
      FROM government_schemes 
      WHERE scheme_code = $1 AND is_active = true
    `;

    const result = await db.query(query, [schemeCode]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SCHEME_NOT_FOUND',
          message: 'Government scheme not found or inactive',
          timestamp: new Date().toISOString()
        }
      });
    }

    const scheme = result.rows[0];
    
    const schemeDetails = {
      id: scheme.scheme_code,
      name: scheme.scheme_name,
      description: scheme.description,
      max_claim_amount: scheme.max_claim_amount ? parseFloat(scheme.max_claim_amount) : null,
      eligibility_criteria: scheme.eligibility_criteria,
      application_process: scheme.application_process,
      required_documents: typeof scheme.required_documents === 'string' 
        ? JSON.parse(scheme.required_documents) 
        : scheme.required_documents || [],
      validity: {
        start_date: scheme.start_date,
        end_date: scheme.end_date,
        is_active: !scheme.end_date || new Date(scheme.end_date) > new Date()
      },
      created_at: scheme.created_at,
      updated_at: scheme.updated_at
    };
    
    res.json({
      success: true,
      data: { scheme: schemeDetails },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get scheme details error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_SCHEME_DETAILS_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;