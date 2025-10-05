const jwt = require('jsonwebtoken');
const { logger } = require('../config/database');

/**
 * JWT Authentication Middleware
 * Verifies JWT token and extracts user information
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'NO_TOKEN',
        message: 'Access token is required',
        timestamp: new Date().toISOString()
      }
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      let errorCode = 'INVALID_TOKEN';
      let message = 'Invalid token';
      
      if (err.name === 'TokenExpiredError') {
        errorCode = 'TOKEN_EXPIRED';
        message = 'Token has expired';
      } else if (err.name === 'JsonWebTokenError') {
        errorCode = 'INVALID_TOKEN';
        message = 'Invalid token format';
      }

      return res.status(403).json({
        success: false,
        error: {
          code: errorCode,
          message: message,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Add user info to request object
    req.user = {
      id: user.userId,
      email: user.email,
      user_type: user.userType,
      name: user.name
    };

    next();
  });
};

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles - Array of allowed user types
 */
const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }
      });
    }

    if (!allowedRoles.includes(req.user.user_type)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
          timestamp: new Date().toISOString()
        }
      });
    }

    next();
  };
};

/**
 * Farmer-only access middleware
 */
const farmerOnly = authorizeRoles(['farmer']);

/**
 * Government-only access middleware
 */
const governmentOnly = authorizeRoles(['government']);

/**
 * Admin access middleware (both farmer and government)
 */
const adminAccess = authorizeRoles(['farmer', 'government']);

module.exports = {
  authenticateToken,
  authorizeRoles,
  farmerOnly,
  governmentOnly,
  adminAccess
};