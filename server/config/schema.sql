-- ================================================================
-- KRISHI CONNECT DATABASE SCHEMA
-- PostgreSQL Implementation for Node.js/Express Server
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
-- 9. CLIMATE DAMAGE CLAIMS TABLE
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