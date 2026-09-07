import * as auditLogModel from "../models/auditLogModel.js";

/**
 * Audit Log Controller — read-only endpoints for the admin UI.
 */

/**
 * GET /api/admin/audit-logs
 * List audit logs with pagination, filtering, and search.
 */
export const listAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, action, entity_type, admin_id, start_date, end_date, search } = req.query;
    const result = await auditLogModel.getAuditLogs({
      page,
      limit,
      action,
      entityType: entity_type,
      adminId: admin_id,
      startDate: start_date,
      endDate: end_date,
      search,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/audit-logs/:id
 * Get a single audit log by ID.
 */
export const getAuditLog = async (req, res, next) => {
  try {
    const log = await auditLogModel.getAuditLogById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: "السجل غير موجود" });
    }
    res.json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};
