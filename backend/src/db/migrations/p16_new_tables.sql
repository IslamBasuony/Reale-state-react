-- P16 Migration: Newsletter, Contact, Inquiries, Password Reset, Email Verification, Admin
-- Safe to run multiple times (IF NOT EXISTS on all objects)

-- =====================================================
-- NEWSLETTER SUBSCRIBERS
-- =====================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    email VARCHAR(320) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_newsletter_subscribers_updated_at'
    ) THEN
        CREATE TRIGGER update_newsletter_subscribers_updated_at
            BEFORE UPDATE ON newsletter_subscribers
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================================
-- CONTACT MESSAGES
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(320) NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PROJECT INQUIRIES
-- Projects are static frontend data; project_id is a stable string identifier.
-- =====================================================
CREATE TABLE IF NOT EXISTS project_inquiries (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    project_id VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(320) NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_inquiries_project_id ON project_inquiries(project_id);

-- =====================================================
-- PASSWORD RESET TOKENS
-- Stores only hashed tokens, never plaintext.
-- =====================================================
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

-- =====================================================
-- EMAIL VERIFICATION TOKENS
-- Foundation only; delivery integration deferred.
-- =====================================================
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

-- =====================================================
-- ADMIN ROLE on clients table
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clients' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE clients ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- =====================================================
-- RATE LIMITING TABLE (optional, for express-rate-limit pg store)
-- Using in-memory store instead, so this is NOT needed.
-- =====================================================
