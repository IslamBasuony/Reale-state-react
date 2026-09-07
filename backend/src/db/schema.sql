-- =====================================================
-- REAL ESTATE DATABASE SCHEMA - NORMALIZED & OPTIMIZED
-- =====================================================

-- =====================================================
-- ENUM TYPES
-- =====================================================

-- 

/* Recommendations from chatgpt on that schema.
Keep all current indexes — none are harmful.
Optionally remove redundancy:

Either idx_properties_status or idx_properties_status_type, depending on query patterns.

Consider adding these if you notice query slowness later:

(property_id, rating) on reviews

(agent_id, status) on property_viewings

Don’t over-index — each index adds slight write overhead (on INSERT/UPDATE). For your use case (real estate listings), this schema is well balanced.*/ 

-- =====================================================
-- DROP ALL OBJECTS (for reseeding in development)
-- =====================================================

-- 1. Drop views first
DROP VIEW IF EXISTS vw_agent_performance CASCADE;
DROP VIEW IF EXISTS vw_properties_full CASCADE;

-- 2. Drop triggers (optional, CASCADE on tables handles them, but explicit is cleaner)
DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
DROP TRIGGER IF EXISTS update_areas_updated_at ON areas;
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
DROP TRIGGER IF EXISTS update_viewings_updated_at ON property_viewings;

-- 3. Drop the trigger function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 4. Drop all tables (reverse dependency order: children → parents)
DROP TABLE IF EXISTS property_viewings CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS property_images CASCADE;
DROP TABLE IF EXISTS property_amenities CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS amenities CASCADE;
DROP TABLE IF EXISTS areas CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS agents CASCADE;

-- 5. Drop custom ENUM types (these often block reseeding if not dropped)
DROP TYPE IF EXISTS viewing_status CASCADE;
DROP TYPE IF EXISTS property_type CASCADE;
DROP TYPE IF EXISTS property_status CASCADE;
DROP TYPE IF EXISTS property_purpose CASCADE;
DROP TYPE IF EXISTS currency CASCADE;
DROP TYPE IF EXISTS price_period CASCADE;

-- =====================================================
-- END OF DROP SCRIPT
-- =====================================================



CREATE TYPE  property_status AS ENUM ('available', 'sold', 'rented', 'pending');

-- Transaction purpose: is the listing for sale or for rent?
-- This is independent of lifecycle `status` (available/sold/rented/pending).
CREATE TYPE property_purpose AS ENUM ('sale', 'rent');

-- Price currency: explicit so no consumer ever assumes a currency.
CREATE TYPE currency AS ENUM ('EGP', 'USD');

-- Price period: 'sale' for sale listings, 'monthly'/'yearly' for rent listings.
-- `purpose` remains the ONLY sale/rent discriminator; price_period must never derive purpose.
CREATE TYPE price_period AS ENUM ('sale', 'monthly', 'yearly');

CREATE TYPE property_type AS ENUM (
    'apartment',
    'villa',
    'duplex',
    'penthouse',
    'studio',
    'townhouse',
    'office',
    'shop',
    'warehouse',
    'land'
);

CREATE TYPE viewing_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

-- =====================================================
-- BASE TABLES (No Dependencies)
-- =====================================================

CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(320) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    password VARCHAR(255) NOT NULL,
    bio TEXT,
    profile_image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL ,
    email VARCHAR(320) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS areas (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(255) UNIQUE NOT NULL,
    city VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    lang VARCHAR(3) NOT NULL CHECK (lang IN ('ar', 'en')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS amenities (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(100) UNIQUE NOT NULL,
    lang VARCHAR(3) NOT NULL CHECK (lang IN ('ar', 'en')),
    icon VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PROPERTIES TABLE (Main Entity)
-- =====================================================

CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title VARCHAR(255) NOT NULL,
    price DECIMAL(12, 2) NOT NULL CHECK (price > 0),
    currency currency NOT NULL DEFAULT 'EGP',
    price_period price_period NOT NULL DEFAULT 'monthly',
    description TEXT,
    address VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status property_status DEFAULT 'available',
    purpose property_purpose NOT NULL DEFAULT 'sale',
    bedrooms_number INT CHECK (bedrooms_number >= 0),
    bathrooms_number INT CHECK (bathrooms_number >= 0),
    area_size DECIMAL(10, 2) CHECK (area_size > 0),
    lang VARCHAR(3) NOT NULL CHECK (lang IN ('ar', 'en')),
    type property_type NOT NULL,
    agent_id INT NOT NULL,
    area_id INT,
    parking_spaces INT DEFAULT 0 CHECK (parking_spaces >= 0),
    floor_number INT,
    total_floors INT,
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- =====================================================
-- JUNCTION & RELATED TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS property_amenities (
    property_id INT NOT NULL,
    amenity_id INT NOT NULL,
    PRIMARY KEY (property_id, amenity_id),
    FOREIGN KEY (property_id) REFERENCES properties(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS property_images (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    property_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    caption VARCHAR(255),
    lang VARCHAR(3) NOT NULL CHECK (lang IN ('ar', 'en')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) 
);

CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    client_id INT NOT NULL,
    agent_id INT NOT NULL,
    property_id INT,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS property_viewings (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    property_id INT NOT NULL,
    client_id INT NOT NULL,
    agent_id INT NOT NULL,
    viewing_date TIMESTAMP NOT NULL,
    status viewing_status DEFAULT 'scheduled',
    notes TEXT,
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR NOT NULL,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL,
    PRIMARY KEY (sid)
);



-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Properties table indexes (most queried)
CREATE INDEX IF NOT EXISTS idx_properties_lang ON properties(lang);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_purpose ON properties(purpose);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_area ON properties(area_id);
CREATE INDEX IF NOT EXISTS idx_properties_agent ON properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_properties_status_type ON properties(status, type);


-- Areas table indexes
CREATE INDEX IF NOT EXISTS idx_areas_city ON areas(city);
CREATE INDEX IF NOT EXISTS idx_areas_lang ON areas(lang);

-- Reviews table indexes
CREATE INDEX IF NOT EXISTS idx_reviews_agent ON reviews(agent_id);
CREATE INDEX IF NOT EXISTS idx_reviews_property ON reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client ON reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Property viewings indexes
CREATE INDEX IF NOT EXISTS idx_viewings_property ON property_viewings(property_id);
CREATE INDEX IF NOT EXISTS idx_viewings_client ON property_viewings(client_id);
CREATE INDEX IF NOT EXISTS idx_viewings_agent ON property_viewings(agent_id);
CREATE INDEX IF NOT EXISTS idx_viewings_date ON property_viewings(viewing_date);
CREATE INDEX IF NOT EXISTS idx_viewings_status ON property_viewings(status);

-- Property images indexes
CREATE INDEX IF NOT EXISTS idx_images_property ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_images_primary ON property_images(property_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_property_images_lang ON property_images(lang);

CREATE INDEX IF NOT EXISTS idx_amenities_lang ON amenities(lang);


-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON areas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_viewings_updated_at BEFORE UPDATE ON property_viewings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA (removed)
-- Language-less sample areas/amenities previously lived here.
-- They occupied the first serial IDs and collided with the
-- per-language seed data (areas/amenities UNIQUE(name)),
-- so all relationship references from the JSON seeds
-- resolved to the wrong rows. Data is now seeded entirely
-- by the explicit seed script (ArabicSeeds/EnglishSeeds).
-- =====================================================

-- =====================================================
-- USEFUL VIEWS
-- =====================================================

-- View: Properties with full details
CREATE OR REPLACE VIEW vw_properties_full AS
SELECT 
    p.*,
    ag.first_name || ' ' || ag.last_name AS agent_name,
    ag.phone AS agent_phone,
    ag.email AS agent_email,
    ar.name AS area_name,
    ar.city AS city,
    COUNT(DISTINCT pi.id) AS image_count,
    COUNT(DISTINCT r.id) AS review_count,
    AVG(r.rating) AS average_rating
FROM properties p
LEFT JOIN agents ag ON p.agent_id = ag.id
LEFT JOIN areas ar ON p.area_id = ar.id
LEFT JOIN property_images pi ON p.id = pi.property_id
LEFT JOIN reviews r ON p.id = r.property_id
GROUP BY p.id, ag.id, ar.id;

-- View: Agent performance
CREATE OR REPLACE VIEW vw_agent_performance AS
SELECT 
    a.id,
    a.first_name || ' ' || a.last_name AS agent_name,
    COUNT(DISTINCT p.id) AS total_properties,
    COUNT(DISTINCT CASE WHEN p.status = 'sold' THEN p.id END) AS properties_sold,
    COUNT(DISTINCT CASE WHEN p.status = 'rented' THEN p.id END) AS properties_rented,
    COUNT(DISTINCT r.id) AS total_reviews,
    AVG(r.rating) AS average_rating,
    COUNT(DISTINCT pv.id) AS total_viewings
FROM agents a
LEFT JOIN properties p ON a.id = p.agent_id
LEFT JOIN reviews r ON a.id = r.agent_id
LEFT JOIN property_viewings pv ON a.id = pv.agent_id
GROUP BY a.id;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE properties IS 'Main table storing all property listings';
COMMENT ON COLUMN properties.purpose IS 'Transaction purpose (sale | rent); independent of lifecycle status';
COMMENT ON TABLE agents IS 'Real estate agents managing properties';
COMMENT ON TABLE clients IS 'Potential buyers/renters';
COMMENT ON TABLE areas IS 'Geographic areas/neighborhoods';
COMMENT ON TABLE amenities IS 'Property features (pool, gym, etc.)';
COMMENT ON TABLE property_amenities IS 'Many-to-many relationship between properties and amenities';
COMMENT ON TABLE property_images IS 'Property photos and media';
COMMENT ON TABLE reviews IS 'Client reviews of agents and properties';
COMMENT ON TABLE property_viewings IS 'Scheduled and completed property viewings';

-- =====================================================
-- END OF SCHEMA
-- =====================================================

-- =====================================================
-- P16 NEW TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    email VARCHAR(320) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_newsletter_subscribers_updated_at
    BEFORE UPDATE ON newsletter_subscribers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(320) NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_inquiries (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    project_id VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(320) NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_inquiries_project_id ON project_inquiries(project_id);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id INTEGER NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES clients(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id INTEGER NOT NULL UNIQUE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES clients(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token_hash ON email_verification_tokens(token_hash);

-- is_admin on clients
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clients' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE clients ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;












