-- Phase 7.5 Hotfix: Performance indexes
-- Safe to run multiple times (IF NOT EXISTS on all objects)

-- Sessions expire index: speeds up connect-pg-simple cleanup queries
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);

-- Partial index for admin count queries (countAdmins)
CREATE INDEX IF NOT EXISTS idx_clients_is_admin ON clients(is_admin) WHERE is_admin = TRUE;
