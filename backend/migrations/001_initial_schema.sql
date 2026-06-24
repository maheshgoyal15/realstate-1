-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Mandatory Secure Web Skills: Principle of Least Privilege Database Roles
-- Create application role with restricted DML permissions (no root/admin access)
-- Note: In a live environment, passwords would be managed via AWS KMS / Secrets Manager.
-- TODO(security): Integrate dynamic IAM database authentication for production deployments.
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'homeready_app') THEN
        CREATE ROLE homeready_app WITH LOGIN PASSWORD 'homeready_app_secure_pw_2026!';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'homeready_readonly') THEN
        CREATE ROLE homeready_readonly WITH LOGIN PASSWORD 'homeready_readonly_secure_pw_2026!';
    END IF;
END
$$;

-- Table: users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Stored using Argon2id / bcrypt
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'homeowner', -- 'homeowner', 'agent', 'team_lead', 'admin'
    organization_id UUID,
    white_label_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Table: properties
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address VARCHAR(500) NOT NULL,
    mls_id VARCHAR(100),
    property_type VARCHAR(50) DEFAULT 'RES',
    year_built INTEGER,
    square_feet INTEGER,
    bedrooms NUMERIC(3,1),
    bathrooms NUMERIC(3,1),
    lot_size NUMERIC(12,2),
    budget_ceiling NUMERIC(12,2) DEFAULT 0.00,
    style_preference VARCHAR(100),
    raw_mls_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_properties_mls_id ON properties(mls_id);

-- Table: analyses
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    cv_summary JSONB DEFAULT '{}'::jsonb,
    image_embedding vector(1536), -- Vector embedding for similarity matching
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_analyses_property_id ON analyses(property_id);

-- Table: recommendations
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    category VARCHAR(255) NOT NULL,
    estimated_cost NUMERIC(12,2) NOT NULL,
    projected_value_increase NUMERIC(12,2) NOT NULL,
    roi_percentage NUMERIC(8,2) NOT NULL,
    timeline VARCHAR(100) NOT NULL,
    explanation TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'suggested', -- 'suggested', 'in_progress', 'completed'
    actual_spend NUMERIC(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_recommendations_analysis_id ON recommendations(analysis_id);
CREATE INDEX idx_recommendations_roi ON recommendations(roi_percentage DESC);

-- Table: reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    s3_pdf_key VARCHAR(1024) NOT NULL,
    shareable_token VARCHAR(255) UNIQUE NOT NULL,
    is_password_protected BOOLEAN DEFAULT FALSE,
    access_password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_reports_analysis_id ON reports(analysis_id);
CREATE INDEX idx_reports_token ON reports(shareable_token);

-- Table: contractors
CREATE TABLE contractors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    trade_category VARCHAR(100) NOT NULL,
    service_zip_codes TEXT[] NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    rating NUMERIC(3,2) DEFAULT 5.00,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_contractors_trade ON contractors(trade_category);
CREATE INDEX idx_contractors_zip ON contractors USING GIN (service_zip_codes);

-- Table: lead_requests
CREATE TABLE lead_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'viewed', 'quoted', 'accepted', 'rejected'
    attribution_token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_lead_requests_user ON lead_requests(user_id);
CREATE INDEX idx_lead_requests_contractor ON lead_requests(contractor_id);

-- Grant least-privilege permissions to application role
GRANT SELECT, INSERT, UPDATE, DELETE ON users, properties, analyses, recommendations, reports, contractors, lead_requests TO homeready_app;

-- Grant SELECT-only permissions to readonly role
GRANT SELECT ON users, properties, analyses, recommendations, reports, contractors, lead_requests TO homeready_readonly;
