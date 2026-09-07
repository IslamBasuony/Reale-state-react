-- Phase 7 Migration: Audit Logs
-- Safe to run multiple times (IF NOT EXISTS on all objects)

-- =====================================================
-- AUDIT LOGS
-- Immutable record of all admin mutation actions.
-- No UPDATE or DELETE triggers — records are write-once.
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    admin_id INTEGER NOT NULL,
    action VARCHAR(60) NOT NULL,
    entity_type VARCHAR(30) NOT NULL,
    entity_id INTEGER,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NOTE: No ON DELETE CASCADE — audit records survive even if the admin
-- account is later deleted.  We intentionally omit a foreign key to
-- clients so that deleting an admin never cascades into audit history.

-- =====================================================
-- INDEXES — only the columns that are actually queried
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
