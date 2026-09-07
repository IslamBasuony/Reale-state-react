import pool from "../db/pool.js";

/**
 * Audit Log Model — immutable write-once records.
 *
 * Public API:
 *   createAuditLog({ adminId, action, entityType, entityId, description, metadata, ip, userAgent })
 *   getAuditLogs({ page, limit, action, entityType, adminId, startDate, endDate, search })
 *   getAuditLogById(id)
 *
 * No updateAuditLog() or deleteAuditLog() — audit records are immutable.
 */

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Insert a new audit log record.
 * Returns the created row.
 */
export const createAuditLog = async ({
  adminId,
  action,
  entityType,
  entityId = null,
  description,
  metadata = {},
  ip = null,
  userAgent = null,
}) => {
  await pool.query(
    `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, metadata, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [adminId, action, entityType, entityId, description, JSON.stringify(metadata), ip, userAgent]
  );
};

/**
 * List audit logs with pagination, filtering, and search.
 */
export const getAuditLogs = async ({
  page = 1,
  limit = DEFAULT_LIMIT,
  action = null,
  entityType = null,
  adminId = null,
  startDate = null,
  endDate = null,
  search = null,
} = {}) => {
  const safeLimit = Math.min(Math.max(1, Number(limit) || DEFAULT_LIMIT), MAX_LIMIT);
  const safePage = Math.max(1, Number(page) || 1);
  const offset = (safePage - 1) * safeLimit;

  const conditions = [];
  const values = [];
  let idx = 1;

  if (action) {
    conditions.push(`al.action = $${idx++}`);
    values.push(action);
  }
  if (entityType) {
    conditions.push(`al.entity_type = $${idx++}`);
    values.push(entityType);
  }
  if (adminId) {
    conditions.push(`al.admin_id = $${idx++}`);
    values.push(Number(adminId));
  }
  if (startDate) {
    conditions.push(`al.created_at >= $${idx++}`);
    values.push(startDate);
  }
  if (endDate) {
    conditions.push(`al.created_at <= $${idx++}`);
    values.push(endDate);
  }
  if (search) {
    conditions.push(`(al.description ILIKE $${idx} OR c.email ILIKE $${idx} OR CAST(al.entity_id AS TEXT) LIKE $${idx})`);
    values.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [countResult, dataResult] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) FROM audit_logs al
       LEFT JOIN clients c ON c.id = al.admin_id
       ${where}`,
      values
    ),
    pool.query(
      `SELECT al.id, al.admin_id, al.action, al.entity_type, al.entity_id,
              al.description, al.metadata, al.ip_address, al.user_agent, al.created_at,
              c.email AS admin_email,
              c.first_name AS admin_first_name,
              c.last_name AS admin_last_name
       FROM audit_logs al
       LEFT JOIN clients c ON c.id = al.admin_id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, safeLimit, offset]
    ),
  ]);

  const total = Number(countResult.rows[0].count);
  const totalPages = Math.ceil(total / safeLimit);

  return {
    logs: dataResult.rows,
    page: safePage,
    limit: safeLimit,
    total,
    totalPages,
  };
};

/**
 * Get a single audit log by ID, joined with admin info.
 */
export const getAuditLogById = async (id) => {
  const result = await pool.query(
    `SELECT al.id, al.admin_id, al.action, al.entity_type, al.entity_id,
            al.description, al.metadata, al.ip_address, al.user_agent, al.created_at,
            c.email AS admin_email,
            c.first_name AS admin_first_name,
            c.last_name AS admin_last_name
     FROM audit_logs al
     LEFT JOIN clients c ON c.id = al.admin_id
     WHERE al.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};
