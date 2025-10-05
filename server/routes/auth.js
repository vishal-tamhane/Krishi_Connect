const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { 
  validateUserRegistration, 
  validateUserLogin 
} = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../config/database');

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { email, password, name, phone, user_type, location } = req.body;
    
    // Create user
    const user = await userService.createUser({
      email,
      password,
      name,
      phone,
      user_type,
      location
    });
    
    // Generate JWT token
    const token = userService.generateToken(user);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          user_type: user.user_type,
          location: user.location
        },
        token
      },
      timestamp: new Date().toISOString()
    });
    
    logger.info(`User registration successful: ${email}`);
  } catch (error) {
    logger.error('Registration error:', error);
    
    let statusCode = 500;
    let errorCode = 'REGISTRATION_FAILED';
    
    if (error.message.includes('Email already exists')) {
      statusCode = 409;
      errorCode = 'EMAIL_EXISTS';
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
 * @route POST /api/auth/login
 * @desc Authenticate user and return token
 * @access Public
 */
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password, user_type } = req.body;
    
    // Authenticate user
    const user = await userService.authenticateUser(email, password);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Check user type if specified
    if (user_type && user.user_type !== user_type) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'USER_TYPE_MISMATCH',
          message: 'User type does not match',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Generate JWT token
    const token = userService.generateToken(user);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          user_type: user.user_type,
          location: user.location
        },
        token
      },
      timestamp: new Date().toISOString()
    });
    
    logger.info(`User login successful: ${email}`);
  } catch (error) {
    logger.error('Login error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          user_type: user.user_type,
          location: user.location,
          created_at: user.created_at,
          last_login: user.last_login
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_PROFILE_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, location } = req.body;
    
    const updatedUser = await userService.updateUser(req.user.id, {
      name,
      phone,
      location
    });
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          user_type: updatedUser.user_type,
          location: updatedUser.location,
          updated_at: updatedUser.updated_at
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_PROFILE_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * @route POST /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PASSWORDS',
          message: 'Current password and new password are required',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'New password must be at least 6 characters long',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    const result = await userService.changePassword(
      req.user.id, 
      currentPassword, 
      newPassword
    );
    
    res.json({
      success: true,
      message: 'Password changed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Change password error:', error);
    
    let statusCode = 500;
    let errorCode = 'CHANGE_PASSWORD_FAILED';
    
    if (error.message.includes('Current password is incorrect')) {
      statusCode = 400;
      errorCode = 'INCORRECT_CURRENT_PASSWORD';
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
 * @route POST /api/auth/logout
 * @desc Logout user (client-side token removal)
 * @access Private
 */
router.post('/logout', authenticateToken, (req, res) => {
  // In a stateless JWT system, logout is handled client-side by removing the token
  // This endpoint exists for consistency and future session management if needed
  
  res.json({
    success: true,
    message: 'Logout successful',
    timestamp: new Date().toISOString()
  });
  
  logger.info(`User logout: ${req.user.email}`);
});

module.exports = router;