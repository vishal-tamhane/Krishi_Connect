const express = require('express');
const router = express.Router();
const fieldService = require('../services/fieldService');
const { authenticateToken, farmerOnly } = require('../middleware/auth');
const { validateFieldCreation } = require('../middleware/validation');
const { logger } = require('../config/database');

/**
 * @route POST /api/fields
 * @desc Create a new field
 * @access Private (Farmers only)
 */
router.post('/', authenticateToken, farmerOnly, validateFieldCreation, async (req, res) => {
  try {
    const field = await fieldService.createField(req.user.id, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Field created successfully',
      data: { field },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Create field error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_FIELD_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * @route GET /api/fields
 * @desc Get all fields for current user
 * @access Private (Farmers only)
 */
router.get('/', authenticateToken, farmerOnly, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const fields = await fieldService.getUserFields(req.user.id, limit);
    
    res.json({
      success: true,
      data: { 
        fields,
        count: fields.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get fields error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_FIELDS_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * @route GET /api/fields/:fieldId
 * @desc Get a specific field by ID
 * @access Private (Farmers only)
 */
router.get('/:fieldId', authenticateToken, farmerOnly, async (req, res) => {
  try {
    const { fieldId } = req.params;
    const field = await fieldService.getFieldById(fieldId, req.user.id);
    
    if (!field) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FIELD_NOT_FOUND',
          message: 'Field not found or access denied',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    res.json({
      success: true,
      data: { field },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get field by ID error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_FIELD_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * @route PUT /api/fields/:fieldId
 * @desc Update a field
 * @access Private (Farmers only)
 */
router.put('/:fieldId', authenticateToken, farmerOnly, async (req, res) => {
  try {
    const { fieldId } = req.params;
    const field = await fieldService.updateField(fieldId, req.user.id, req.body);
    
    res.json({
      success: true,
      message: 'Field updated successfully',
      data: { field },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Update field error:', error);
    
    let statusCode = 500;
    let errorCode = 'UPDATE_FIELD_FAILED';
    
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      statusCode = 404;
      errorCode = 'FIELD_NOT_FOUND';
    } else if (error.message.includes('No valid fields')) {
      statusCode = 400;
      errorCode = 'NO_VALID_FIELDS';
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
 * @route DELETE /api/fields/:fieldId
 * @desc Delete a field (soft delete)
 * @access Private (Farmers only)
 */
router.delete('/:fieldId', authenticateToken, farmerOnly, async (req, res) => {
  try {
    const { fieldId } = req.params;
    const result = await fieldService.deleteField(fieldId, req.user.id);
    
    res.json({
      success: true,
      message: 'Field deleted successfully',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Delete field error:', error);
    
    let statusCode = 500;
    let errorCode = 'DELETE_FIELD_FAILED';
    
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      statusCode = 404;
      errorCode = 'FIELD_NOT_FOUND';
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
 * @route GET /api/fields/statistics/summary
 * @desc Get field statistics for dashboard
 * @access Private (Farmers only)
 */
router.get('/statistics/summary', authenticateToken, farmerOnly, async (req, res) => {
  try {
    const statistics = await fieldService.getFieldStatistics(req.user.id);
    
    res.json({
      success: true,
      data: { statistics },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get field statistics error:', error);
    
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