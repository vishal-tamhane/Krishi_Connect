const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db, logger } = require('../config/database');

class UserService {
  /**
   * Create a new user account
   */
  async createUser(userData) {
    const { email, password, name, phone, user_type, location } = userData;
    
    try {
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      const query = `
        INSERT INTO users (email, password_hash, name, phone, user_type, location)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, name, user_type, location, created_at
      `;
      
      const values = [email, passwordHash, name, phone, user_type, location];
      const result = await db.query(query, values);
      
      const user = result.rows[0];
      logger.info(`User created successfully: ${email}`);
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
        location: user.location,
        created_at: user.created_at
      };
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Email already exists');
      }
      logger.error('Error creating user:', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Authenticate user login
   */
  async authenticateUser(email, password) {
    try {
      const query = `
        SELECT id, email, password_hash, name, user_type, location, is_active
        FROM users 
        WHERE email = $1 AND is_active = true
      `;
      
      const result = await db.query(query, [email]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const user = result.rows[0];
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        return null;
      }
      
      // Update last login
      await db.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );
      
      logger.info(`User authenticated successfully: ${email}`);
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
        location: user.location
      };
    } catch (error) {
      logger.error('Error authenticating user:', error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Generate JWT token for user
   */
  generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      userType: user.user_type,
      name: user.name
    };
    
    const options = {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'krishi-connect',
      audience: 'krishi-connect-users'
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, options);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      const query = `
        SELECT id, email, name, user_type, location, is_active, created_at, last_login
        FROM users 
        WHERE id = $1 AND is_active = true
      `;
      
      const result = await db.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  /**
   * Update user profile
   */
  async updateUser(userId, updateData) {
    try {
      const allowedFields = ['name', 'phone', 'location'];
      const updateFields = [];
      const values = [];
      let paramCount = 1;
      
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updateFields.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }
      
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      values.push(userId);
      
      const query = `
        UPDATE users 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING id, email, name, user_type, location, updated_at
      `;
      
      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      logger.info(`User updated successfully: ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating user:', error);
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get current password hash
      const userQuery = 'SELECT password_hash FROM users WHERE id = $1';
      const userResult = await db.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const currentHash = userResult.rows[0].password_hash;
      
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, currentHash);
      
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }
      
      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
      
      // Update password
      const updateQuery = `
        UPDATE users 
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;
      
      await db.query(updateQuery, [newPasswordHash, userId]);
      
      logger.info(`Password changed successfully for user: ${userId}`);
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      logger.error('Error changing password:', error);
      throw new Error(`Failed to change password: ${error.message}`);
    }
  }
}

module.exports = new UserService();