-- Idempotent migration: add created_at indexes for ORDER BY performance
-- Safe to run multiple times (IF NOT EXISTS)

CREATE INDEX IF NOT EXISTS idx_properties_created_at_desc ON properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_created_at_desc ON clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agents_created_at_desc ON agents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
