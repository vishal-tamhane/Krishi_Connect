const express = require('express');
const router = express.Router();
const cropService = require('../services/cropService');
const { authenticateToken, farmerOnly } = require('../middleware/auth');
const { 
  validateCropCreation, 
  validateIrrigationRecord 
} = require('../middleware/validation');
const { logger } = require('../config/database');

/**
 * @route POST /api/crops
 * @desc Create a new crop lifecycle
 * @access Private (Farmers only)
 */
router.post('/', authenticateToken, farmerOnly, validateCropCreation, async (req, res) => {
  try {
    const crop = await cropService.createCropLifecycle(req.user.id, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Crop lifecycle created successfully',
      data: { crop },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Create crop error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_CROP_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * @route GET /api/crops
 * @desc Get all crops for current user
 * @access Private (Farmers only)
 */
router.get('/', authenticateToken, farmerOnly, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const crops = await cropService.getUserCrops(req.user.id, limit);
    
    res.json({
      success: true,
      data: { 
        crops,
        count: crops.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get crops error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_CROPS_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * @route GET /api/crops/:cropId
 * @desc Get a specific crop by ID
 * @access Private (Farmers only)
 */
router.get('/:cropId', authenticateToken, farmerOnly, async (req, res) => {
  try {
    const { cropId } = req.params;
    const crop = await cropService.getCropById(cropId, req.user.id);
    
    if (!crop) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CROP_NOT_FOUND',
          message: 'Crop not found or access denied',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    res.json({
      success: true,
      data: { crop },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get crop by ID error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_CROP_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * @route POST /api/crops/:cropId/irrigation
 * @desc Add irrigation record to crop
 * @access Private (Farmers only)
 */
router.post('/:cropId/irrigation', authenticateToken, farmerOnly, validateIrrigationRecord, async (req, res) => {
  try {
    const { cropId } = req.params;
    const record = await cropService.addIrrigationRecord(cropId, req.user.id, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Irrigation record added successfully',
      data: { irrigation_record: record },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Add irrigation record error:', error);
    
    let statusCode = 500;
    let errorCode = 'ADD_IRRIGATION_FAILED';
    
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      statusCode = 404;
      errorCode = 'CROP_NOT_FOUND';
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
 * @route POST /api/crops/:cropId/fertilizer
 * @desc Add fertilizer record to crop
 * @access Private (Farmers only)
 */
router.post('/:cropId/fertilizer', authenticateToken, farmerOnly, async (req, res) => {
  try {
    const { cropId } = req.params;
    const { 
      application_date, 
      nutrient_type, 
      amount_kg_per_ha, 
      application_method, 
      fertilizer_name, 
      notes 
    } = req.body;

    // Basic validation
    if (!application_date || !nutrient_type || !amount_kg_per_ha) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Application date, nutrient type, and amount are required',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (!['N', 'P', 'K', 'NPK'].includes(nutrient_type.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_NUTRIENT_TYPE',
          message: 'Nutrient type must be N, P, K, or NPK',
          timestamp: new Date().toISOString()
        }
      });
    }

    const record = await cropService.addFertilizerRecord(cropId, req.user.id, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Fertilizer record added successfully',
      data: { fertilizer_record: record },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Add fertilizer record error:', error);
    
    let statusCode = 500;
    let errorCode = 'ADD_FERTILIZER_FAILED';
    
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      statusCode = 404;
      errorCode = 'CROP_NOT_FOUND';
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
 * @route GET /api/crops/:cropId/irrigation
 * @desc Get irrigation records for a crop
 * @access Private (Farmers only)
 */
router.get('/:cropId/irrigation', authenticateToken, farmerOnly, async (req, res) => {
  try {
    const { cropId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const records = await cropService.getIrrigationRecords(cropId, req.user.id, limit);
    
    res.json({
      success: true,
      data: { 
        irrigation_records: records,
        count: records.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get irrigation records error:', error);
    
    let statusCode = 500;
    let errorCode = 'GET_IRRIGATION_RECORDS_FAILED';
    
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      statusCode = 404;
      errorCode = 'CROP_NOT_FOUND';
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
 * @route GET /api/crops/:cropId/fertilizer
 * @desc Get fertilizer records for a crop
 * @access Private (Farmers only)
 */
router.get('/:cropId/fertilizer', authenticateToken, farmerOnly, async (req, res) => {
  try {
    const { cropId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const records = await cropService.getFertilizerRecords(cropId, req.user.id, limit);
    
    res.json({
      success: true,
      data: { 
        fertilizer_records: records,
        count: records.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get fertilizer records error:', error);
    
    let statusCode = 500;
    let errorCode = 'GET_FERTILIZER_RECORDS_FAILED';
    
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      statusCode = 404;
      errorCode = 'CROP_NOT_FOUND';
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
 * @route PUT /api/crops/:cropId/stage
 * @desc Update crop growth stage
 * @access Private (Farmers only)
 */
router.put('/:cropId/stage', authenticateToken, farmerOnly, async (req, res) => {
  try {
    const { cropId } = req.params;
    const { stage } = req.body;

    if (!stage) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_STAGE',
          message: 'Stage is required',
          timestamp: new Date().toISOString()
        }
      });
    }

    const validStages = ['seeded', 'germination', 'vegetative', 'flowering', 'fruiting', 'maturity', 'harvested'];
    if (!validStages.includes(stage.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STAGE',
          message: `Stage must be one of: ${validStages.join(', ')}`,
          timestamp: new Date().toISOString()
        }
      });
    }

    const crop = await cropService.updateCropStage(cropId, req.user.id, stage);
    
    res.json({
      success: true,
      message: 'Crop stage updated successfully',
      data: { crop },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Update crop stage error:', error);
    
    let statusCode = 500;
    let errorCode = 'UPDATE_STAGE_FAILED';
    
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      statusCode = 404;
      errorCode = 'CROP_NOT_FOUND';
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
 * @route GET /api/crops/statistics/summary
 * @desc Get crop statistics for dashboard
 * @access Private (Farmers only)
 */
router.get('/statistics/summary', authenticateToken, farmerOnly, async (req, res) => {
  try {
    const statistics = await cropService.getCropStatistics(req.user.id);
    
    res.json({
      success: true,
      data: { statistics },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get crop statistics error:', error);
    
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