const fs = require('fs');
const path = require('path');
const { db, logger } = require('../config/database');

/**
 * Initialize PostgreSQL Database
 * Creates tables, indexes, triggers, and seeds initial data
 */
async function initializeDatabase() {
  try {
    logger.info('🚀 Starting database initialization...');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, '..', 'config', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    logger.info('📋 Creating database schema...');
    await db.query(schemaSQL);
    logger.info('✅ Database schema created successfully');
    
    // Seed initial data
    await seedInitialData();
    
    logger.info('🎉 Database initialization completed successfully!');
    return true;
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Seed initial data
 */
async function seedInitialData() {
  try {
    logger.info('🌱 Seeding initial data...');
    
    // Seed government schemes
    await seedGovernmentSchemes();
    
    logger.info('✅ Initial data seeded successfully');
  } catch (error) {
    logger.error('❌ Failed to seed initial data:', error);
    throw error;
  }
}

/**
 * Seed government schemes
 */
async function seedGovernmentSchemes() {
  try {
    const schemes = [
      {
        scheme_code: 'PMFBY',
        scheme_name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
        description: 'Comprehensive crop insurance scheme providing coverage for pre-sowing to post-harvest losses due to non-preventable risks.',
        max_claim_amount: 200000.00,
        eligibility_criteria: 'All farmers growing notified crops in notified areas during notified seasons',
        application_process: 'Apply through nearest bank branch, CSC, or online portal within cutoff dates',
        required_documents: [
          'Aadhaar Card',
          'Bank Account Details',
          'Land Records (Khata/Khatauni)',
          'Sowing Certificate',
          'Previous Insurance Policy (if any)'
        ]
      },
      {
        scheme_code: 'WBCIS',
        scheme_name: 'Weather Based Crop Insurance Scheme (WBCIS)',
        description: 'Insurance scheme based on weather parameters affecting crop production.',
        max_claim_amount: 150000.00,
        eligibility_criteria: 'Farmers affected by adverse weather conditions in notified areas',
        application_process: 'Register through participating insurance companies or government offices',
        required_documents: [
          'Identity Proof',
          'Address Proof',
          'Land Ownership Documents',
          'Bank Account Details',
          'Crop Details'
        ]
      },
      {
        scheme_code: 'NAIS',
        scheme_name: 'National Agricultural Insurance Scheme (NAIS)',
        description: 'Basic crop insurance scheme for protection against natural calamities, pests, and diseases.',
        max_claim_amount: 100000.00,
        eligibility_criteria: 'Small and marginal farmers with landholding up to 2 hectares',
        application_process: 'Apply through rural banks and cooperative societies',
        required_documents: [
          'Farmer ID Card',
          'Land Records',
          'Bank Passbook',
          'Crop Loss Certificate',
          'Revenue Records'
        ]
      },
      {
        scheme_code: 'DISASTER_RELIEF',
        scheme_name: 'State Disaster Relief Fund (SDRF)',
        description: 'Emergency financial assistance for farmers affected by natural disasters.',
        max_claim_amount: 50000.00,
        eligibility_criteria: 'Farmers in areas declared as disaster-affected by state government',
        application_process: 'Apply through District Collector office or online disaster relief portal',
        required_documents: [
          'Disaster Affected Certificate',
          'Crop Loss Assessment Report',
          'Identity and Address Proof',
          'Bank Details',
          'Photographs of Damage'
        ]
      },
      {
        scheme_code: 'KISAN_CREDIT',
        scheme_name: 'Kisan Credit Card Scheme (KCC)',
        description: 'Credit support for crop recovery and agricultural activities post-damage.',
        max_claim_amount: 300000.00,
        eligibility_criteria: 'KCC holders with valid insurance coverage',
        application_process: 'Apply through issuing bank branch with required documents',
        required_documents: [
          'Existing KCC',
          'Insurance Policy Documents',
          'Crop Loss Certificate',
          'Income Certificate',
          'Collateral Documents (if required)'
        ]
      },
      {
        scheme_code: 'MODIFIED_NAIS',
        scheme_name: 'Modified National Agricultural Insurance Scheme',
        description: 'Enhanced version of NAIS with improved coverage and claim settlement process.',
        max_claim_amount: 175000.00,
        eligibility_criteria: 'All categories of farmers including sharecroppers and tenant farmers',
        application_process: 'Apply through participating banks and insurance companies',
        required_documents: [
          'Valid ID Proof',
          'Land Documents or Tenancy Agreement',
          'Bank Account Details',
          'Crop Cutting Experiment Certificate',
          'Previous Claim History (if any)'
        ]
      }
    ];

    for (const scheme of schemes) {
      const checkQuery = 'SELECT scheme_code FROM government_schemes WHERE scheme_code = $1';
      const existingScheme = await db.query(checkQuery, [scheme.scheme_code]);
      
      if (existingScheme.rows.length === 0) {
        const insertQuery = `
          INSERT INTO government_schemes (
            scheme_code, scheme_name, description, max_claim_amount,
            eligibility_criteria, application_process, required_documents,
            is_active, start_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        
        await db.query(insertQuery, [
          scheme.scheme_code,
          scheme.scheme_name,
          scheme.description,
          scheme.max_claim_amount,
          scheme.eligibility_criteria,
          scheme.application_process,
          JSON.stringify(scheme.required_documents),
          true,
          new Date()
        ]);
        
        logger.info(`✓ Seeded scheme: ${scheme.scheme_code}`);
      } else {
        logger.info(`- Scheme already exists: ${scheme.scheme_code}`);
      }
    }
    
    logger.info('✅ Government schemes seeded successfully');
  } catch (error) {
    logger.error('❌ Failed to seed government schemes:', error);
    throw error;
  }
}

/**
 * Drop all tables (use with caution)
 */
async function dropAllTables() {
  try {
    logger.warn('⚠️ Dropping all tables...');
    
    const tables = [
      'weather_data',
      'government_schemes',
      'climate_damage_claims',
      'yield_predictions',
      'fertilizer_records',
      'irrigation_records',
      'crop_growth_stages',
      'crops',
      'fields',
      'user_sessions',
      'users'
    ];
    
    for (const table of tables) {
      await db.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
      logger.info(`✓ Dropped table: ${table}`);
    }
    
    // Drop the update timestamp function
    await db.query('DROP FUNCTION IF EXISTS update_timestamp() CASCADE;');
    logger.info('✓ Dropped functions');
    
    logger.warn('⚠️ All tables dropped successfully');
  } catch (error) {
    logger.error('❌ Failed to drop tables:', error);
    throw error;
  }
}

/**
 * Reset database (drop and recreate)
 */
async function resetDatabase() {
  try {
    logger.warn('🔄 Resetting database...');
    
    await dropAllTables();
    await initializeDatabase();
    
    logger.info('🔄 Database reset completed successfully');
  } catch (error) {
    logger.error('❌ Database reset failed:', error);
    throw error;
  }
}

/**
 * Check database status
 */
async function checkDatabaseStatus() {
  try {
    logger.info('🔍 Checking database status...');
    
    // Check if main tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'users', 'fields', 'crops', 'climate_damage_claims', 
        'government_schemes', 'yield_predictions'
      )
      ORDER BY table_name
    `;
    
    const tablesResult = await db.query(tablesQuery);
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    // Check record counts
    const counts = {};
    for (const table of existingTables) {
      const countResult = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
      counts[table] = parseInt(countResult.rows[0].count);
    }
    
    const status = {
      tables_exist: existingTables.length,
      expected_tables: 6,
      tables: existingTables,
      record_counts: counts,
      database_ready: existingTables.length >= 6
    };
    
    logger.info('📊 Database Status:', status);
    return status;
  } catch (error) {
    logger.error('❌ Failed to check database status:', error);
    throw error;
  }
}

module.exports = {
  initializeDatabase,
  seedInitialData,
  seedGovernmentSchemes,
  dropAllTables,
  resetDatabase,
  checkDatabaseStatus
};