const { body, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array(),
        timestamp: new Date().toISOString()
      }
    });
  }
  next();
};

/**
 * User registration validation
 */
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('user_type')
    .isIn(['farmer', 'government'])
    .withMessage('User type must be either farmer or government'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  handleValidationErrors
];

/**
 * User login validation
 */
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Field creation validation
 */
const validateFieldCreation = [
  body('field_name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Field name must be between 2 and 255 characters'),
  body('coordinates')
    .isArray({ min: 3 })
    .withMessage('At least 3 coordinates are required for field boundary'),
  body('coordinates.*.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required'),
  body('coordinates.*.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required'),
  body('area_hectares')
    .isFloat({ min: 0.01 })
    .withMessage('Area must be greater than 0.01 hectares'),
  body('soil_ph')
    .optional()
    .isFloat({ min: 0, max: 14 })
    .withMessage('Soil pH must be between 0 and 14'),
  handleValidationErrors
];

/**
 * Crop creation validation
 */
const validateCropCreation = [
  body('field_id')
    .isUUID()
    .withMessage('Valid field ID is required'),
  body('crop_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Crop name must be between 2 and 100 characters'),
  body('sowing_date')
    .isISO8601()
    .toDate()
    .withMessage('Valid sowing date is required'),
  body('expected_harvest_date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid expected harvest date is required'),
  handleValidationErrors
];

/**
 * Irrigation record validation
 */
const validateIrrigationRecord = [
  body('irrigation_date')
    .isISO8601()
    .toDate()
    .withMessage('Valid irrigation date is required'),
  body('amount_mm')
    .isFloat({ min: 0.1 })
    .withMessage('Amount must be greater than 0.1 mm'),
  body('duration_minutes')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
  handleValidationErrors
];

/**
 * Climate damage claim validation
 */
const validateClimateClaimCreation = [
  body('farmer_name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Farmer name must be between 2 and 255 characters'),
  body('farmer_email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid farmer email is required'),
  body('farmer_phone')
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('farm_location')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Farm location must be between 5 and 500 characters'),
  body('incident_date')
    .isISO8601()
    .toDate()
    .withMessage('Valid incident date is required'),
  body('damage_type')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Damage type is required'),
  body('affected_area_hectares')
    .isFloat({ min: 0.01 })
    .withMessage('Affected area must be greater than 0.01 hectares'),
  body('estimated_loss_amount')
    .isFloat({ min: 1 })
    .withMessage('Estimated loss amount must be greater than 1'),
  body('severity_level')
    .isIn(['mild', 'moderate', 'severe', 'complete'])
    .withMessage('Severity level must be mild, moderate, severe, or complete'),
  body('damage_description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Damage description must be between 10 and 2000 characters'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateFieldCreation,
  validateCropCreation,
  validateIrrigationRecord,
  validateClimateClaimCreation
};