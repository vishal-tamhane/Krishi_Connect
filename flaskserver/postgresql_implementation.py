# PostgreSQL Implementation for Krishi Connect
# Complete Data Flow Documentation and Implementation

import psycopg2
import psycopg2.extras
from psycopg2.pool import SimpleConnectionPool
from datetime import datetime, timezone
import uuid
import json
from contextlib import contextmanager
import logging
import os
from werkzeug.security import generate_password_hash, check_password_hash

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ================================================================
# PostgreSQL Database Configuration and Connection Management
# ================================================================

class PostgreSQLConfig:
    """
    PostgreSQL Database Configuration and Connection Management
    
    This class handles all database connections, connection pooling,
    and provides utilities for database operations.
    """
    
    def __init__(self):
        # Database Configuration
        self.DB_CONFIG = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'krishi_connect'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'password'),
        }
        
        self.connection_pool = None
        self.is_connected = False
    
    def connect(self):
        """Initialize connection pool to PostgreSQL"""
        try:
            # Create connection pool (min 2, max 20 connections)
            self.connection_pool = SimpleConnectionPool(
                minconn=2,
                maxconn=20,
                **self.DB_CONFIG
            )
            
            # Test connection
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT 1;")
                    result = cursor.fetchone()
                    if result:
                        logger.info("✅ Connected to PostgreSQL successfully")
                        self.is_connected = True
                        return True
        except Exception as e:
            logger.error(f"❌ Failed to connect to PostgreSQL: {str(e)}")
            return False
    
    @contextmanager
    def get_connection(self):
        """Get connection from pool with automatic cleanup"""
        conn = None
        try:
            conn = self.connection_pool.getconn()
            yield conn
        finally:
            if conn:
                self.connection_pool.putconn(conn)
    
    def close_connections(self):
        """Close all database connections"""
        if self.connection_pool:
            self.connection_pool.closeall()
            logger.info("🔒 PostgreSQL connections closed")

# ================================================================
# Database Schema Creation (DDL)
# ================================================================

class DatabaseSchema:
    """
    Complete Database Schema for Krishi Connect
    
    This defines all tables, relationships, indexes, and constraints
    for the agricultural management system.
    """
    
    @staticmethod
    def get_schema_sql():
        """Return complete SQL schema for all tables"""
        return """
        -- ================================================================
        -- KRISHI CONNECT DATABASE SCHEMA
        -- PostgreSQL Implementation
        -- ================================================================
        
        -- Enable UUID extension
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        -- ================================================================
        -- 1. USERS TABLE (Authentication & User Management)
        -- ================================================================
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('farmer', 'government')),
            location TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            email_verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP WITH TIME ZONE
        );
        
        -- ================================================================
        -- 2. USER SESSIONS TABLE (Session Management)
        -- ================================================================
        CREATE TABLE IF NOT EXISTS user_sessions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            session_token VARCHAR(255) UNIQUE NOT NULL,
            ip_address INET,
            user_agent TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            expires_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- ================================================================
        -- 3. FIELDS TABLE (Farm Field Management)
        -- ================================================================
        CREATE TABLE IF NOT EXISTS fields (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            field_name VARCHAR(255) NOT NULL,
            coordinates JSONB NOT NULL, -- Array of lat/lng coordinates
            area_hectares DECIMAL(10,4) NOT NULL,
            soil_type VARCHAR(100),
            elevation DECIMAL(8,2),
            slope_percentage DECIMAL(5,2),
            drainage_type VARCHAR(50),
            
            -- Soil Parameters
            soil_nitrogen DECIMAL(8,3),
            soil_phosphorus DECIMAL(8,3),
            soil_potassium DECIMAL(8,3),
            soil_ph DECIMAL(4,2),
            organic_matter_percentage DECIMAL(5,2),
            soil_moisture_percentage DECIMAL(5,2),
            
            -- Weather Data
            average_temperature DECIMAL(5,2),
            annual_rainfall DECIMAL(8,2),
            average_humidity DECIMAL(5,2),
            
            status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- ================================================================
        -- 4. CROPS TABLE (Crop Lifecycle Management)
        -- ================================================================
        CREATE TABLE IF NOT EXISTS crops (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
            crop_name VARCHAR(100) NOT NULL,
            crop_variety VARCHAR(100),
            sowing_date DATE NOT NULL,
            expected_harvest_date DATE,
            actual_harvest_date DATE,
            
            -- Sowing Parameters
            sowing_nitrogen DECIMAL(8,3),
            sowing_phosphorus DECIMAL(8,3),
            sowing_potassium DECIMAL(8,3),
            sowing_ph DECIMAL(4,2),
            sowing_temperature DECIMAL(5,2),
            sowing_humidity DECIMAL(5,2),
            sowing_rainfall DECIMAL(8,2),
            sowing_soil_moisture DECIMAL(5,2),
            
            -- Irrigation Totals
            total_water_used DECIMAL(10,3) DEFAULT 0,
            irrigation_method VARCHAR(50) DEFAULT 'manual',
            
            -- Fertilizer Totals
            total_nitrogen_applied DECIMAL(8,3) DEFAULT 0,
            total_phosphorus_applied DECIMAL(8,3) DEFAULT 0,
            total_potassium_applied DECIMAL(8,3) DEFAULT 0,
            
            -- Status Tracking
            current_stage VARCHAR(50) DEFAULT 'seeded',
            crop_status VARCHAR(20) DEFAULT 'active' CHECK (crop_status IN ('active', 'completed', 'failed', 'harvested')),
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- ================================================================
        -- 5. CROP GROWTH STAGES TABLE
        -- ================================================================
        CREATE TABLE IF NOT EXISTS crop_growth_stages (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
            stage_name VARCHAR(50) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE,
            duration_days INTEGER,
            kc_value DECIMAL(4,3), -- Crop coefficient
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- ================================================================
        -- 6. IRRIGATION RECORDS TABLE
        -- ================================================================
        CREATE TABLE IF NOT EXISTS irrigation_records (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
            irrigation_date DATE NOT NULL,
            amount_mm DECIMAL(6,2) NOT NULL,
            irrigation_method VARCHAR(50) DEFAULT 'manual',
            duration_minutes INTEGER,
            notes TEXT,
            recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- ================================================================
        -- 7. FERTILIZER RECORDS TABLE
        -- ================================================================
        CREATE TABLE IF NOT EXISTS fertilizer_records (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
            application_date DATE NOT NULL,
            nutrient_type VARCHAR(10) NOT NULL, -- N, P, K, NPK
            amount_kg_per_ha DECIMAL(8,3) NOT NULL,
            application_method VARCHAR(50), -- basal, top_dress, foliar
            fertilizer_name VARCHAR(100),
            notes TEXT,
            recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- ================================================================
        -- 8. YIELD PREDICTIONS TABLE
        -- ================================================================
        CREATE TABLE IF NOT EXISTS yield_predictions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
            crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
            
            -- Prediction Input Parameters
            prediction_date DATE NOT NULL DEFAULT CURRENT_DATE,
            days_after_sowing INTEGER,
            current_stage VARCHAR(50),
            
            -- Environmental Parameters at Prediction
            temp_celsius DECIMAL(5,2),
            humidity_percent DECIMAL(5,2),
            rainfall_mm DECIMAL(8,2),
            soil_moisture_percent DECIMAL(5,2),
            
            -- Management Parameters
            irrigation_total_mm DECIMAL(8,3),
            fertilizer_applied_kg DECIMAL(8,3),
            pest_disease_pressure VARCHAR(20) DEFAULT 'low',
            
            -- Prediction Results
            expected_yield_per_hectare DECIMAL(8,3),
            total_expected_yield DECIMAL(10,3),
            quality_grade VARCHAR(20),
            predicted_harvest_date DATE,
            confidence_score DECIMAL(5,4),
            
            -- Risk Assessment
            risk_factors JSONB, -- Array of risk factors
            recommendations JSONB, -- Array of recommendations
            
            -- Model Information
            model_version VARCHAR(20) DEFAULT '1.0',
            prediction_method VARCHAR(50) DEFAULT 'ml_model',
            input_features JSONB,
            
            -- Actual Results (filled after harvest)
            actual_yield DECIMAL(8,3),
            actual_harvest_date DATE,
            actual_quality VARCHAR(20),
            accuracy_score DECIMAL(5,4),
            
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- ================================================================
        -- 9. CLIMATE DAMAGE CLAIMS TABLE (New Feature)
        -- ================================================================
        CREATE TABLE IF NOT EXISTS climate_damage_claims (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            field_id UUID REFERENCES fields(id) ON DELETE SET NULL,
            crop_id UUID REFERENCES crops(id) ON DELETE SET NULL,
            
            -- Personal Information
            farmer_name VARCHAR(255) NOT NULL,
            farmer_email VARCHAR(255) NOT NULL,
            farmer_phone VARCHAR(20) NOT NULL,
            farm_location TEXT NOT NULL,
            farmer_address TEXT NOT NULL,
            
            -- Damage Details
            incident_date DATE NOT NULL,
            damage_type VARCHAR(50) NOT NULL,
            crop_type VARCHAR(100) NOT NULL,
            affected_area_hectares DECIMAL(10,4) NOT NULL,
            estimated_loss_amount DECIMAL(12,2) NOT NULL,
            severity_level VARCHAR(20) NOT NULL CHECK (severity_level IN ('mild', 'moderate', 'severe', 'complete')),
            damage_description TEXT NOT NULL,
            
            -- Weather Information
            weather_condition VARCHAR(100),
            damage_duration VARCHAR(50),
            
            -- Scheme Information
            selected_scheme_id VARCHAR(50),
            scheme_name VARCHAR(255),
            claim_amount DECIMAL(12,2),
            
            -- Supporting Documents
            uploaded_photos JSONB, -- Array of photo file information
            supporting_documents JSONB, -- Array of document file information
            
            -- Claim Status
            claim_status VARCHAR(20) DEFAULT 'submitted' CHECK (claim_status IN ('submitted', 'under_review', 'approved', 'rejected', 'completed')),
            claim_reference_number VARCHAR(50) UNIQUE,
            government_notes TEXT,
            approved_amount DECIMAL(12,2),
            approval_date DATE,
            payment_date DATE,
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- ================================================================
        -- 10. GOVERNMENT SCHEMES TABLE
        -- ================================================================
        CREATE TABLE IF NOT EXISTS government_schemes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            scheme_code VARCHAR(50) UNIQUE NOT NULL,
            scheme_name VARCHAR(255) NOT NULL,
            description TEXT,
            max_claim_amount DECIMAL(12,2),
            eligibility_criteria TEXT,
            application_process TEXT,
            required_documents JSONB,
            is_active BOOLEAN DEFAULT TRUE,
            start_date DATE,
            end_date DATE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- ================================================================
        -- 11. WEATHER DATA TABLE (Optional - for historical weather)
        -- ================================================================
        CREATE TABLE IF NOT EXISTS weather_data (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
            record_date DATE NOT NULL,
            temperature_min DECIMAL(5,2),
            temperature_max DECIMAL(5,2),
            temperature_avg DECIMAL(5,2),
            humidity DECIMAL(5,2),
            rainfall DECIMAL(8,2),
            wind_speed DECIMAL(5,2),
            solar_radiation DECIMAL(8,2),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- ================================================================
        -- INDEXES FOR PERFORMANCE OPTIMIZATION
        -- ================================================================
        
        -- User-related indexes
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
        
        -- Field-related indexes
        CREATE INDEX IF NOT EXISTS idx_fields_user_id ON fields(user_id);
        CREATE INDEX IF NOT EXISTS idx_fields_status ON fields(status);
        
        -- Crop-related indexes
        CREATE INDEX IF NOT EXISTS idx_crops_user_id ON crops(user_id);
        CREATE INDEX IF NOT EXISTS idx_crops_field_id ON crops(field_id);
        CREATE INDEX IF NOT EXISTS idx_crops_sowing_date ON crops(sowing_date);
        CREATE INDEX IF NOT EXISTS idx_crops_status ON crops(crop_status);
        
        -- Growth stage indexes
        CREATE INDEX IF NOT EXISTS idx_growth_stages_crop_id ON crop_growth_stages(crop_id);
        CREATE INDEX IF NOT EXISTS idx_growth_stages_date ON crop_growth_stages(start_date);
        
        -- Irrigation indexes
        CREATE INDEX IF NOT EXISTS idx_irrigation_crop_id ON irrigation_records(crop_id);
        CREATE INDEX IF NOT EXISTS idx_irrigation_date ON irrigation_records(irrigation_date);
        
        -- Fertilizer indexes
        CREATE INDEX IF NOT EXISTS idx_fertilizer_crop_id ON fertilizer_records(crop_id);
        CREATE INDEX IF NOT EXISTS idx_fertilizer_date ON fertilizer_records(application_date);
        
        -- Yield prediction indexes
        CREATE INDEX IF NOT EXISTS idx_yield_pred_user_id ON yield_predictions(user_id);
        CREATE INDEX IF NOT EXISTS idx_yield_pred_crop_id ON yield_predictions(crop_id);
        CREATE INDEX IF NOT EXISTS idx_yield_pred_date ON yield_predictions(prediction_date);
        
        -- Climate damage claim indexes
        CREATE INDEX IF NOT EXISTS idx_claims_user_id ON climate_damage_claims(user_id);
        CREATE INDEX IF NOT EXISTS idx_claims_status ON climate_damage_claims(claim_status);
        CREATE INDEX IF NOT EXISTS idx_claims_incident_date ON climate_damage_claims(incident_date);
        CREATE INDEX IF NOT EXISTS idx_claims_reference ON climate_damage_claims(claim_reference_number);
        
        -- Weather data indexes
        CREATE INDEX IF NOT EXISTS idx_weather_field_id ON weather_data(field_id);
        CREATE INDEX IF NOT EXISTS idx_weather_date ON weather_data(record_date);
        
        -- ================================================================
        -- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
        -- ================================================================
        
        -- Function to update timestamp
        CREATE OR REPLACE FUNCTION update_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        -- Apply triggers to all tables with updated_at column
        CREATE TRIGGER users_update_timestamp 
            BEFORE UPDATE ON users 
            FOR EACH ROW EXECUTE FUNCTION update_timestamp();
            
        CREATE TRIGGER fields_update_timestamp 
            BEFORE UPDATE ON fields 
            FOR EACH ROW EXECUTE FUNCTION update_timestamp();
            
        CREATE TRIGGER crops_update_timestamp 
            BEFORE UPDATE ON crops 
            FOR EACH ROW EXECUTE FUNCTION update_timestamp();
            
        CREATE TRIGGER yield_predictions_update_timestamp 
            BEFORE UPDATE ON yield_predictions 
            FOR EACH ROW EXECUTE FUNCTION update_timestamp();
            
        CREATE TRIGGER climate_damage_claims_update_timestamp 
            BEFORE UPDATE ON climate_damage_claims 
            FOR EACH ROW EXECUTE FUNCTION update_timestamp();
        
        -- ================================================================
        -- INITIAL DATA SETUP (Government Schemes)
        -- ================================================================
        
        INSERT INTO government_schemes (scheme_code, scheme_name, description, max_claim_amount, eligibility_criteria) VALUES
        ('PMFBY', 'Pradhan Mantri Fasal Bima Yojana (PMFBY)', 'Comprehensive crop insurance for weather-related losses', 200000.00, 'All farmers growing notified crops'),
        ('WBCIS', 'Weather Based Crop Insurance Scheme (WBCIS)', 'Insurance based on weather parameters', 150000.00, 'Farmers affected by adverse weather'),
        ('NAIS', 'National Agricultural Insurance Scheme (NAIS)', 'Basic crop insurance for natural calamities', 100000.00, 'Small and marginal farmers'),
        ('DISASTER_RELIEF', 'State Disaster Relief Fund', 'Emergency relief for climate disasters', 50000.00, 'Farmers in disaster-declared areas'),
        ('KISAN_CREDIT', 'Kisan Credit Card Scheme', 'Credit support for crop recovery', 300000.00, 'KCC holders with valid insurance')
        ON CONFLICT (scheme_code) DO NOTHING;
        """

# ================================================================
# Data Access Layer (PostgreSQL Services)
# ================================================================

class UserService:
    """
    User Management Service
    Handles authentication, user registration, and user data management
    """
    
    def __init__(self, db_config):
        self.db = db_config
    
    def create_user(self, email, password, name, phone, user_type, location=None):
        """Create a new user account"""
        try:
            password_hash = generate_password_hash(password)
            
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO users (email, password_hash, name, phone, user_type, location)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING id, email, name, user_type, created_at
                    """, (email, password_hash, name, phone, user_type, location))
                    
                    user_data = cursor.fetchone()
                    conn.commit()
                    
                    return {
                        'id': str(user_data[0]),
                        'email': user_data[1],
                        'name': user_data[2],
                        'user_type': user_data[3],
                        'created_at': user_data[4].isoformat()
                    }
        except psycopg2.IntegrityError as e:
            if 'unique constraint' in str(e).lower():
                raise Exception("Email already exists")
            raise Exception(f"Database error: {str(e)}")
        except Exception as e:
            raise Exception(f"Error creating user: {str(e)}")
    
    def authenticate_user(self, email, password):
        """Authenticate user login"""
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        SELECT id, email, password_hash, name, user_type, location
                        FROM users 
                        WHERE email = %s AND is_active = TRUE
                    """, (email,))
                    
                    user_data = cursor.fetchone()
                    
                    if user_data and check_password_hash(user_data[2], password):
                        # Update last login
                        cursor.execute("""
                            UPDATE users SET last_login = CURRENT_TIMESTAMP 
                            WHERE id = %s
                        """, (user_data[0],))
                        conn.commit()
                        
                        return {
                            'id': str(user_data[0]),
                            'email': user_data[1],
                            'name': user_data[3],
                            'user_type': user_data[4],
                            'location': user_data[5]
                        }
                    
                    return None
        except Exception as e:
            raise Exception(f"Authentication error: {str(e)}")

class FieldService:
    """
    Field Management Service
    Handles all field-related operations
    """
    
    def __init__(self, db_config):
        self.db = db_config
    
    def create_field(self, user_id, field_data):
        """Create a new field"""
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO fields (
                            user_id, field_name, coordinates, area_hectares, soil_type,
                            elevation, slope_percentage, drainage_type,
                            soil_nitrogen, soil_phosphorus, soil_potassium, soil_ph,
                            organic_matter_percentage, soil_moisture_percentage,
                            average_temperature, annual_rainfall, average_humidity
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        ) RETURNING id, field_name, created_at
                    """, (
                        user_id, field_data['field_name'], json.dumps(field_data['coordinates']),
                        field_data['area_hectares'], field_data.get('soil_type'),
                        field_data.get('elevation'), field_data.get('slope_percentage'),
                        field_data.get('drainage_type'), field_data.get('soil_nitrogen'),
                        field_data.get('soil_phosphorus'), field_data.get('soil_potassium'),
                        field_data.get('soil_ph'), field_data.get('organic_matter_percentage'),
                        field_data.get('soil_moisture_percentage'), field_data.get('average_temperature'),
                        field_data.get('annual_rainfall'), field_data.get('average_humidity')
                    ))
                    
                    result = cursor.fetchone()
                    conn.commit()
                    
                    return {
                        'id': str(result[0]),
                        'field_name': result[1],
                        'created_at': result[2].isoformat()
                    }
        except Exception as e:
            raise Exception(f"Error creating field: {str(e)}")
    
    def get_user_fields(self, user_id, limit=50):
        """Get all fields for a user"""
        try:
            with self.db.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT id, field_name, coordinates, area_hectares, soil_type,
                               status, created_at, updated_at
                        FROM fields 
                        WHERE user_id = %s AND status = 'active'
                        ORDER BY created_at DESC
                        LIMIT %s
                    """, (user_id, limit))
                    
                    fields = cursor.fetchall()
                    
                    # Convert UUIDs to strings and parse JSON
                    result = []
                    for field in fields:
                        field_dict = dict(field)
                        field_dict['id'] = str(field_dict['id'])
                        field_dict['coordinates'] = json.loads(field_dict['coordinates']) if field_dict['coordinates'] else []
                        field_dict['created_at'] = field_dict['created_at'].isoformat()
                        field_dict['updated_at'] = field_dict['updated_at'].isoformat()
                        result.append(field_dict)
                    
                    return result
        except Exception as e:
            raise Exception(f"Error fetching fields: {str(e)}")

class CropService:
    """
    Crop Lifecycle Management Service
    Handles all crop-related operations
    """
    
    def __init__(self, db_config):
        self.db = db_config
    
    def create_crop_lifecycle(self, user_id, crop_data):
        """Create a new crop lifecycle"""
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO crops (
                            user_id, field_id, crop_name, crop_variety, sowing_date,
                            expected_harvest_date, sowing_nitrogen, sowing_phosphorus,
                            sowing_potassium, sowing_ph, sowing_temperature,
                            sowing_humidity, sowing_rainfall, sowing_soil_moisture,
                            irrigation_method
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        ) RETURNING id, crop_name, sowing_date, created_at
                    """, (
                        user_id, crop_data['field_id'], crop_data['crop_name'],
                        crop_data.get('crop_variety'), crop_data['sowing_date'],
                        crop_data.get('expected_harvest_date'), crop_data.get('sowing_nitrogen'),
                        crop_data.get('sowing_phosphorus'), crop_data.get('sowing_potassium'),
                        crop_data.get('sowing_ph'), crop_data.get('sowing_temperature'),
                        crop_data.get('sowing_humidity'), crop_data.get('sowing_rainfall'),
                        crop_data.get('sowing_soil_moisture'), crop_data.get('irrigation_method', 'manual')
                    ))
                    
                    result = cursor.fetchone()
                    conn.commit()
                    
                    return {
                        'id': str(result[0]),
                        'crop_name': result[1],
                        'sowing_date': result[2].isoformat(),
                        'created_at': result[3].isoformat()
                    }
        except Exception as e:
            raise Exception(f"Error creating crop lifecycle: {str(e)}")
    
    def add_irrigation_record(self, crop_id, irrigation_data):
        """Add irrigation record and update crop totals"""
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    # Insert irrigation record
                    cursor.execute("""
                        INSERT INTO irrigation_records (
                            crop_id, irrigation_date, amount_mm, irrigation_method,
                            duration_minutes, notes
                        ) VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING id
                    """, (
                        crop_id, irrigation_data['irrigation_date'], irrigation_data['amount_mm'],
                        irrigation_data.get('irrigation_method', 'manual'),
                        irrigation_data.get('duration_minutes'), irrigation_data.get('notes')
                    ))
                    
                    record_id = cursor.fetchone()[0]
                    
                    # Update crop total water used
                    cursor.execute("""
                        UPDATE crops 
                        SET total_water_used = total_water_used + %s,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    """, (irrigation_data['amount_mm'], crop_id))
                    
                    conn.commit()
                    return str(record_id)
        except Exception as e:
            raise Exception(f"Error adding irrigation record: {str(e)}")

class ClimateClaimService:
    """
    Climate Damage Claim Service
    Handles all climate damage claim operations
    """
    
    def __init__(self, db_config):
        self.db = db_config
    
    def create_climate_claim(self, user_id, claim_data):
        """Create a new climate damage claim"""
        try:
            # Generate unique claim reference number
            claim_ref = f"CLM{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:8].upper()}"
            
            with self.db.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO climate_damage_claims (
                            user_id, field_id, crop_id, farmer_name, farmer_email,
                            farmer_phone, farm_location, farmer_address, incident_date,
                            damage_type, crop_type, affected_area_hectares,
                            estimated_loss_amount, severity_level, damage_description,
                            weather_condition, damage_duration, selected_scheme_id,
                            scheme_name, claim_amount, uploaded_photos,
                            supporting_documents, claim_reference_number
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s, %s, %s
                        ) RETURNING id, claim_reference_number, created_at
                    """, (
                        user_id, claim_data.get('field_id'), claim_data.get('crop_id'),
                        claim_data['farmer_name'], claim_data['farmer_email'],
                        claim_data['farmer_phone'], claim_data['farm_location'],
                        claim_data['farmer_address'], claim_data['incident_date'],
                        claim_data['damage_type'], claim_data['crop_type'],
                        claim_data['affected_area_hectares'], claim_data['estimated_loss_amount'],
                        claim_data['severity_level'], claim_data['damage_description'],
                        claim_data.get('weather_condition'), claim_data.get('damage_duration'),
                        claim_data.get('selected_scheme_id'), claim_data.get('scheme_name'),
                        claim_data.get('claim_amount'), json.dumps(claim_data.get('uploaded_photos', [])),
                        json.dumps(claim_data.get('supporting_documents', [])), claim_ref
                    ))
                    
                    result = cursor.fetchone()
                    conn.commit()
                    
                    return {
                        'id': str(result[0]),
                        'claim_reference_number': result[1],
                        'created_at': result[2].isoformat(),
                        'status': 'submitted'
                    }
        except Exception as e:
            raise Exception(f"Error creating climate claim: {str(e)}")

# ================================================================
# COMPLETE DATA FLOW DOCUMENTATION
# ================================================================

class DataFlowDocumentation:
    """
    Complete Data Flow Documentation for Krishi Connect
    
    This class documents all data flows between frontend and backend,
    including API endpoints, data structures, and database operations.
    """
    
    @staticmethod
    def get_complete_data_flow():
        return """
        ================================================================
        KRISHI CONNECT - COMPLETE DATA FLOW DOCUMENTATION
        Frontend (React) ↔ Backend (Flask/PostgreSQL)
        ================================================================
        
        1. USER AUTHENTICATION FLOW
        ================================================================
        
        Frontend → Backend:
        POST /api/auth/register
        {
            "email": "farmer@example.com",
            "password": "securepassword",
            "name": "John Farmer",
            "phone": "+91-9876543210",
            "user_type": "farmer",
            "location": "Pune, Maharashtra"
        }
        
        Backend → Database:
        INSERT INTO users (email, password_hash, name, phone, user_type, location)
        
        Backend → Frontend:
        {
            "success": true,
            "user": {
                "id": "uuid-here",
                "email": "farmer@example.com",
                "name": "John Farmer",
                "user_type": "farmer"
            },
            "token": "jwt-token-here"
        }
        
        ================================================================
        
        Frontend → Backend:
        POST /api/auth/login
        {
            "email": "farmer@example.com",
            "password": "securepassword",
            "user_type": "farmer"
        }
        
        Backend Database Query:
        SELECT id, email, password_hash, name, user_type 
        FROM users WHERE email = %s AND is_active = TRUE
        
        Backend → Frontend:
        {
            "success": true,
            "user": {
                "id": "uuid-here",
                "email": "farmer@example.com",
                "name": "John Farmer",
                "user_type": "farmer"
            },
            "token": "jwt-token-here"
        }
        
        ================================================================
        2. FIELD MANAGEMENT FLOW
        ================================================================
        
        Frontend → Backend:
        POST /api/fields
        {
            "field_name": "North Field",
            "coordinates": [
                {"lat": 18.5204, "lng": 73.8567},
                {"lat": 18.5205, "lng": 73.8568}
            ],
            "area_hectares": 2.5,
            "soil_type": "Loamy",
            "soil_nitrogen": 45.5,
            "soil_phosphorus": 25.3,
            "soil_potassium": 180.2,
            "soil_ph": 6.8,
            "average_temperature": 28.5,
            "annual_rainfall": 1200.0
        }
        
        Backend Database Operation:
        INSERT INTO fields (user_id, field_name, coordinates, area_hectares, 
                           soil_type, soil_nitrogen, soil_phosphorus, soil_potassium, 
                           soil_ph, average_temperature, annual_rainfall)
        VALUES (user_id, 'North Field', coordinates_json, 2.5, 'Loamy', 
                45.5, 25.3, 180.2, 6.8, 28.5, 1200.0)
        
        Backend → Frontend:
        {
            "success": true,
            "field": {
                "id": "field-uuid",
                "field_name": "North Field",
                "area_hectares": 2.5,
                "created_at": "2025-10-04T10:30:00Z"
            }
        }
        
        ================================================================
        
        Frontend → Backend:
        GET /api/fields
        
        Backend Database Query:
        SELECT id, field_name, coordinates, area_hectares, soil_type, 
               status, created_at, updated_at
        FROM fields 
        WHERE user_id = %s AND status = 'active'
        ORDER BY created_at DESC
        
        Backend → Frontend:
        {
            "success": true,
            "fields": [
                {
                    "id": "field-uuid-1",
                    "field_name": "North Field",
                    "coordinates": [...],
                    "area_hectares": 2.5,
                    "soil_type": "Loamy",
                    "created_at": "2025-10-04T10:30:00Z"
                }
            ]
        }
        
        ================================================================
        3. CROP LIFECYCLE FLOW
        ================================================================
        
        Frontend → Backend:
        POST /api/crops
        {
            "field_id": "field-uuid",
            "crop_name": "Wheat",
            "crop_variety": "HD-2967",
            "sowing_date": "2025-11-15",
            "expected_harvest_date": "2025-04-15",
            "sowing_nitrogen": 45.5,
            "sowing_phosphorus": 25.3,
            "sowing_temperature": 22.5,
            "sowing_humidity": 65.0,
            "irrigation_method": "drip"
        }
        
        Backend Database Operation:
        INSERT INTO crops (user_id, field_id, crop_name, crop_variety, 
                          sowing_date, expected_harvest_date, sowing_nitrogen,
                          sowing_phosphorus, sowing_temperature, sowing_humidity,
                          irrigation_method)
        VALUES (user_id, field_id, 'Wheat', 'HD-2967', '2025-11-15', 
                '2025-04-15', 45.5, 25.3, 22.5, 65.0, 'drip')
        
        Backend → Frontend:
        {
            "success": true,
            "crop": {
                "id": "crop-uuid",
                "crop_name": "Wheat",
                "sowing_date": "2025-11-15",
                "current_stage": "seeded",
                "created_at": "2025-10-04T10:30:00Z"
            }
        }
        
        ================================================================
        4. IRRIGATION MANAGEMENT FLOW
        ================================================================
        
        Frontend → Backend:
        POST /api/crops/{crop_id}/irrigation
        {
            "irrigation_date": "2025-11-20",
            "amount_mm": 25.5,
            "irrigation_method": "drip",
            "duration_minutes": 120,
            "notes": "Regular irrigation after 5 days"
        }
        
        Backend Database Operations:
        1. INSERT INTO irrigation_records (crop_id, irrigation_date, amount_mm, 
                                         irrigation_method, duration_minutes, notes)
        2. UPDATE crops SET total_water_used = total_water_used + 25.5 
           WHERE id = crop_id
        
        Backend → Frontend:
        {
            "success": true,
            "irrigation_record": {
                "id": "irrigation-uuid",
                "amount_mm": 25.5,
                "irrigation_date": "2025-11-20",
                "total_water_used": 125.5
            }
        }
        
        ================================================================
        5. YIELD PREDICTION FLOW
        ================================================================
        
        Frontend → Backend:
        POST /api/yield-predictions
        {
            "field_id": "field-uuid",
            "crop_id": "crop-uuid",
            "days_after_sowing": 45,
            "current_stage": "vegetative",
            "temp_celsius": 28.5,
            "humidity_percent": 70.0,
            "rainfall_mm": 25.0,
            "soil_moisture_percent": 45.0,
            "irrigation_total_mm": 125.5,
            "fertilizer_applied_kg": 50.0,
            "pest_disease_pressure": "low"
        }
        
        Backend ML Processing:
        1. Load trained ML models
        2. Prepare input features
        3. Generate predictions
        4. Calculate confidence scores
        
        Backend Database Operation:
        INSERT INTO yield_predictions (user_id, field_id, crop_id, days_after_sowing,
                                     current_stage, temp_celsius, humidity_percent,
                                     rainfall_mm, soil_moisture_percent,
                                     irrigation_total_mm, fertilizer_applied_kg,
                                     expected_yield_per_hectare, confidence_score,
                                     predicted_harvest_date, recommendations)
        
        Backend → Frontend:
        {
            "success": true,
            "prediction": {
                "id": "prediction-uuid",
                "expected_yield_per_hectare": 4.2,
                "total_expected_yield": 10.5,
                "confidence_score": 0.89,
                "predicted_harvest_date": "2025-04-12",
                "recommendations": [
                    "Increase nitrogen by 10kg/ha",
                    "Monitor for pest activity"
                ]
            }
        }
        
        ================================================================
        6. CLIMATE DAMAGE CLAIM FLOW (NEW FEATURE)
        ================================================================
        
        Frontend → Backend:
        POST /api/climate-damage-claims
        {
            "farmer_name": "John Farmer",
            "farmer_email": "farmer@example.com",
            "farmer_phone": "+91-9876543210",
            "farm_location": "Village Baramati, Pune",
            "farmer_address": "Complete farm address here",
            "incident_date": "2025-10-01",
            "damage_type": "Hailstorm",
            "crop_type": "Wheat",
            "affected_area_hectares": 1.5,
            "estimated_loss_amount": 75000.00,
            "severity_level": "severe",
            "damage_description": "Detailed description of damage...",
            "weather_condition": "Heavy hailstorm with strong winds",
            "selected_scheme_id": "PMFBY",
            "scheme_name": "Pradhan Mantri Fasal Bima Yojana",
            "claim_amount": 200000.00,
            "uploaded_photos": [
                {
                    "filename": "damage1.jpg",
                    "file_path": "/uploads/claims/damage1.jpg",
                    "file_size": 1024000
                }
            ]
        }
        
        Backend Database Operation:
        INSERT INTO climate_damage_claims (user_id, farmer_name, farmer_email,
                                         farmer_phone, farm_location, farmer_address,
                                         incident_date, damage_type, crop_type,
                                         affected_area_hectares, estimated_loss_amount,
                                         severity_level, damage_description,
                                         selected_scheme_id, scheme_name, claim_amount,
                                         uploaded_photos, claim_reference_number)
        
        Backend → Frontend:
        {
            "success": true,
            "claim": {
                "id": "claim-uuid",
                "claim_reference_number": "CLM20251004AB123CD",
                "claim_status": "submitted",
                "created_at": "2025-10-04T10:30:00Z",
                "estimated_processing_time": "7-14 working days"
            }
        }
        
        ================================================================
        7. GOVERNMENT SCHEME SEARCH FLOW
        ================================================================
        
        Frontend → Backend:
        GET /api/government-schemes?search=weather&max_amount=200000
        
        Backend Database Query:
        SELECT scheme_code, scheme_name, description, max_claim_amount,
               eligibility_criteria
        FROM government_schemes 
        WHERE is_active = TRUE 
        AND (scheme_name ILIKE '%weather%' OR description ILIKE '%weather%')
        AND max_claim_amount <= 200000
        ORDER BY max_claim_amount DESC
        
        Backend → Frontend:
        {
            "success": true,
            "schemes": [
                {
                    "id": "PMFBY",
                    "name": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
                    "description": "Comprehensive crop insurance for weather-related losses",
                    "max_amount": "₹2,00,000",
                    "eligibility": "All farmers growing notified crops"
                }
            ]
        }
        
        ================================================================
        8. FILE UPLOAD FLOW (Photos/Documents)
        ================================================================
        
        Frontend → Backend:
        POST /api/upload
        Content-Type: multipart/form-data
        
        File: damage_photo.jpg (binary data)
        Metadata: {
            "upload_type": "climate_claim_photo",
            "claim_id": "claim-uuid"
        }
        
        Backend File Processing:
        1. Validate file type and size
        2. Generate unique filename
        3. Save to secure directory
        4. Create file record in database
        
        Backend → Frontend:
        {
            "success": true,
            "file": {
                "id": "file-uuid",
                "filename": "damage_photo_20251004_123456.jpg",
                "file_path": "/uploads/claims/damage_photo_20251004_123456.jpg",
                "file_size": 1024000,
                "upload_date": "2025-10-04T10:30:00Z"
            }
        }
        
        ================================================================
        9. DASHBOARD DATA AGGREGATION FLOW
        ================================================================
        
        Frontend → Backend:
        GET /api/dashboard/farmer-summary?user_id=user-uuid
        
        Backend Database Queries (Multiple):
        1. SELECT COUNT(*) FROM fields WHERE user_id = %s AND status = 'active'
        2. SELECT COUNT(*) FROM crops WHERE user_id = %s AND crop_status = 'active'
        3. SELECT COUNT(*) FROM yield_predictions WHERE user_id = %s
        4. SELECT COUNT(*) FROM climate_damage_claims WHERE user_id = %s
        5. SELECT crop_name, current_stage, sowing_date FROM crops 
           WHERE user_id = %s AND crop_status = 'active' ORDER BY sowing_date DESC LIMIT 5
        
        Backend → Frontend:
        {
            "success": true,
            "dashboard_data": {
                "total_fields": 3,
                "active_crops": 5,
                "total_predictions": 12,
                "pending_claims": 2,
                "recent_crops": [
                    {
                        "crop_name": "Wheat",
                        "current_stage": "flowering",
                        "sowing_date": "2025-11-15",
                        "days_since_sowing": 45
                    }
                ],
                "weather_alerts": [],
                "upcoming_tasks": [
                    "Fertilizer application due for North Field",
                    "Irrigation scheduled for tomorrow"
                ]
            }
        }
        
        ================================================================
        10. ERROR HANDLING AND LOGGING FLOW
        ================================================================
        
        All API Responses Include:
        {
            "success": boolean,
            "data": object,
            "error": {
                "code": "ERROR_CODE",
                "message": "User-friendly error message",
                "details": "Technical details for debugging",
                "timestamp": "2025-10-04T10:30:00Z"
            },
            "meta": {
                "request_id": "req-uuid",
                "processing_time_ms": 145,
                "api_version": "1.0"
            }
        }
        
        Database Logging:
        All operations are logged with:
        - User ID
        - Action performed
        - Timestamp
        - IP address
        - Request/Response data (sanitized)
        - Processing time
        - Success/Error status
        
        ================================================================
        11. DATA VALIDATION AND SECURITY
        ================================================================
        
        Frontend Validation:
        - Input field validation
        - File type/size validation
        - Date range validation
        - Email format validation
        
        Backend Validation:
        - JWT token validation
        - User permission checks
        - Data type validation
        - SQL injection prevention
        - File upload security
        
        Database Security:
        - Row-level security policies
        - Encrypted sensitive data
        - Audit trails
        - Backup and recovery
        - Connection pooling
        
        ================================================================
        12. PERFORMANCE OPTIMIZATION
        ================================================================
        
        Database Optimizations:
        - Proper indexing on frequently queried columns
        - Connection pooling (2-20 connections)
        - Query result caching
        - Pagination for large datasets
        - Database connection timeout handling
        
        API Optimizations:
        - Response compression
        - Request rate limiting
        - Async processing for heavy operations
        - Background job queues
        - CDN for static file serving
        
        ================================================================
        """

# Global database instance
db_config = PostgreSQLConfig()

def init_postgresql_database():
    """Initialize PostgreSQL database with complete schema"""
    try:
        # Connect to database
        if not db_config.connect():
            return False
        
        # Create schema
        schema_sql = DatabaseSchema.get_schema_sql()
        
        with db_config.get_connection() as conn:
            with conn.cursor() as cursor:
                # Execute schema creation
                cursor.execute(schema_sql)
                conn.commit()
                logger.info("✅ Database schema created successfully")
        
        return True
    except Exception as e:
        logger.error(f"❌ Failed to initialize database: {str(e)}")
        return False

# Export services for use in Flask app
def get_postgresql_services():
    """Get all PostgreSQL services"""
    return {
        'user_service': UserService(db_config),
        'field_service': FieldService(db_config),
        'crop_service': CropService(db_config),
        'climate_claim_service': ClimateClaimService(db_config),
        'db_config': db_config
    }

if __name__ == "__main__":
    # Initialize database and print data flow documentation
    print("Initializing PostgreSQL Database for Krishi Connect...")
    
    if init_postgresql_database():
        print("\n" + "="*80)
        print("DATABASE INITIALIZED SUCCESSFULLY!")
        print("="*80)
        
        # Print complete data flow documentation
        flow_doc = DataFlowDocumentation()
        print(flow_doc.get_complete_data_flow())
        
        print("\n" + "="*80)
        print("NEXT STEPS:")
        print("1. Update your Flask app.py to use PostgreSQL services")
        print("2. Update environment variables with your PostgreSQL credentials")
        print("3. Test API endpoints with the new PostgreSQL backend")
        print("4. Update frontend to handle new response formats")
        print("="*80)
    else:
        print("❌ Failed to initialize database")