import adminModel from "../models/adminModel.js";
import { createAuditLog } from "../models/auditLogModel.js";
import { isValidImagePath } from "../middlewares/upload.js";

// ─── Helpers ────────────────────────────────────────────────────────

const auditMeta = (req) => ({
  ip: req.ip,
  userAgent: req.headers["user-agent"] || null,
});

// ─── Statistics ────────────────────────────────────────────────────────

const getStats = async (req, res, next) => {
  try {
    const stats = await adminModel.getStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await adminModel.getAnalytics();
    return res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

// ─── Properties ────────────────────────────────────────────────────────

const listProperties = async (req, res, next) => {
  try {
    const { page, limit, lang, status, purpose, type } = req.query;
    const result = await adminModel.findAllProperties({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      lang,
      status,
      purpose,
      type,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getProperty = async (req, res, next) => {
  try {
    const property = await adminModel.findPropertyById(req.params.id);
    if (!property) {
      return res
        .status(404)
        .json({ success: false, error: { message: "العقار غير موجود" } });
    }
    return res.status(200).json({ success: true, data: property });
  } catch (error) {
    next(error);
  }
};

const createProperty = async (req, res, next) => {
  try {
    const property = await adminModel.createProperty(req.body, {
      adminId: req.user.id,
      action: "CREATE_PROPERTY",
      entityType: "property",
      description: `تم إضافة عقار "${req.body.title}"`,
      metadata: {
        title: req.body.title,
        price: req.body.price,
        type: req.body.type,
        purpose: req.body.purpose,
      },
      ...auditMeta(req),
    });
    return res.status(201).json({ success: true, data: property });
  } catch (error) {
    next(error);
  }
};

const updateProperty = async (req, res, next) => {
  try {
    const property = await adminModel.updateProperty(req.params.id, req.body, {
      adminId: req.user.id,
      action: "UPDATE_PROPERTY",
      entityType: "property",
      description: `تم تعديل العقار #${req.params.id}`,
      metadata: { fields: Object.keys(req.body).filter((k) => req.body[k] !== undefined) },
      ...auditMeta(req),
    });
    if (!property) {
      return res
        .status(404)
        .json({ success: false, error: { message: "العقار غير موجود" } });
    }
    return res.status(200).json({ success: true, data: property });
  } catch (error) {
    next(error);
  }
};

const deleteProperty = async (req, res, next) => {
  try {
    const deleted = await adminModel.deleteProperty(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, error: { message: "العقار غير موجود" } });
    }
    await createAuditLog({
      adminId: req.user.id,
      action: "DELETE_PROPERTY",
      entityType: "property",
      entityId: Number(req.params.id),
      description: `تم حذف العقار #${req.params.id}`,
      ...auditMeta(req),
    });
    return res
      .status(200)
      .json({ success: true, message: "تم حذف العقار بنجاح" });
  } catch (error) {
    next(error);
  }
};

// ─── Clients ───────────────────────────────────────────────────────────

const listClients = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const result = await adminModel.findAllClients({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getClient = async (req, res, next) => {
  try {
    const client = await adminModel.findClientById(req.params.id);
    if (!client) {
      return res
        .status(404)
        .json({ success: false, error: { message: "المستخدم غير موجود" } });
    }
    return res.status(200).json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
};

const updateClient = async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.user.id) && req.body.is_admin === false) {
      const adminCount = await adminModel.countAdmins();
      if (adminCount <= 1) {
        return res
          .status(400)
          .json({ success: false, error: { message: "لا يمكنك إزالة صلاحيات آخر مسؤول" } });
      }
    }

    const client = await adminModel.updateClient(req.params.id, req.body);
    if (!client) {
      return res
        .status(404)
        .json({ success: false, error: { message: "المستخدم غير موجود" } });
    }
    await createAuditLog({
      adminId: req.user.id,
      action: "UPDATE_CLIENT",
      entityType: "client",
      entityId: Number(req.params.id),
      description: `تم تعديل المستخدم "${client.first_name} ${client.last_name}"`,
      metadata: { fields: Object.keys(req.body).filter((k) => req.body[k] !== undefined) },
      ...auditMeta(req),
    });
    return res.status(200).json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
};

const deleteClient = async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.user.id)) {
      return res
        .status(400)
        .json({ success: false, error: { message: "لا يمكنك حذف حسابك الخاص" } });
    }

    const client = await adminModel.findClientById(req.params.id);
    if (!client) {
      return res
        .status(404)
        .json({ success: false, error: { message: "المستخدم غير موجود" } });
    }

    if (client.is_admin) {
      const adminCount = await adminModel.countAdmins();
      if (adminCount <= 1) {
        return res
          .status(400)
          .json({ success: false, error: { message: "لا يمكن حذف آخر مسؤول في النظام" } });
      }
    }

    await adminModel.deleteClient(req.params.id);
    await createAuditLog({
      adminId: req.user.id,
      action: "DELETE_CLIENT",
      entityType: "client",
      entityId: Number(req.params.id),
      description: `تم حذف المستخدم "${client.first_name} ${client.last_name}"`,
      metadata: { email: client.email, was_admin: client.is_admin },
      ...auditMeta(req),
    });
    return res
      .status(200)
      .json({ success: true, message: "تم حذف المستخدم بنجاح" });
  } catch (error) {
    next(error);
  }
};

// ─── Agents ────────────────────────────────────────────────────────────

const listAgents = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const result = await adminModel.findAllAgents({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getAgent = async (req, res, next) => {
  try {
    const agent = await adminModel.findAgentById(req.params.id);
    if (!agent) {
      return res
        .status(404)
        .json({ success: false, error: { message: "الوسيط غير موجود" } });
    }
    return res.status(200).json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
};

const createAgent = async (req, res, next) => {
  try {
    const agent = await adminModel.createAgent(req.body);
    await createAuditLog({
      adminId: req.user.id,
      action: "CREATE_AGENT",
      entityType: "agent",
      entityId: agent.id,
      description: `تم إضافة الوسيط "${agent.first_name} ${agent.last_name}"`,
      metadata: { first_name: agent.first_name, last_name: agent.last_name, email: agent.email },
      ...auditMeta(req),
    });
    return res.status(201).json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
};

const updateAgent = async (req, res, next) => {
  try {
    const agent = await adminModel.updateAgent(req.params.id, req.body);
    if (!agent) {
      return res
        .status(404)
        .json({ success: false, error: { message: "الوسيط غير موجود" } });
    }
    await createAuditLog({
      adminId: req.user.id,
      action: "UPDATE_AGENT",
      entityType: "agent",
      entityId: Number(req.params.id),
      description: `تم تعديل الوسيط "${agent.first_name} ${agent.last_name}"`,
      metadata: { fields: Object.keys(req.body).filter((k) => req.body[k] !== undefined && k !== "password") },
      ...auditMeta(req),
    });
    return res.status(200).json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
};

const deleteAgent = async (req, res, next) => {
  try {
    const deleted = await adminModel.deleteAgent(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, error: { message: "الوسيط غير موجود" } });
    }
    await createAuditLog({
      adminId: req.user.id,
      action: "DELETE_AGENT",
      entityType: "agent",
      entityId: Number(req.params.id),
      description: `تم حذف الوسيط #${req.params.id}`,
      ...auditMeta(req),
    });
    return res
      .status(200)
      .json({ success: true, message: "تم حذف الوسيط بنجاح" });
  } catch (error) {
    next(error);
  }
};

// ─── Inquiries ─────────────────────────────────────────────────────────

const listInquiries = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await adminModel.findAllInquiries({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ─── Contact Messages ──────────────────────────────────────────────────

const listContacts = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await adminModel.findAllContacts({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ─── Newsletter Subscribers ────────────────────────────────────────────

const listSubscribers = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await adminModel.findAllSubscribers({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ─── Property Images ──────────────────────────────────────────────────

const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: { message: "لم يتم اختيار أي صور" } });
    }
    const images = await adminModel.addPropertyImages(req.params.id, req.files, {
      adminId: req.user.id,
      action: "UPLOAD_PROPERTY_IMAGE",
      entityType: "property",
      description: `تم رفع ${req.files.length} صورة للعقار #${req.params.id}`,
      metadata: {
        file_count: req.files.length,
        files: req.files.map((f) => ({ originalname: f.originalname, size: f.size, mimetype: f.mimetype })),
      },
      ...auditMeta(req),
    });
    return res.status(201).json({ success: true, data: images });
  } catch (error) {
    next(error);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    const deleted = await adminModel.deletePropertyImage(
      req.params.id,
      req.params.imageId
    );
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, error: { message: "الصورة غير موجودة" } });
    }
    // Validate path before unlink to prevent path traversal
    if (isValidImagePath(deleted.image_url)) {
      const fs = await import("fs/promises");
      const pathMod = await import("path");
      const filePath = pathMod.default.join(process.cwd(), deleted.image_url);
      await fs.default.unlink(filePath).catch(() => {});
    }
    await createAuditLog({
      adminId: req.user.id,
      action: "DELETE_PROPERTY_IMAGE",
      entityType: "property",
      entityId: Number(req.params.id),
      description: `تم حذف صورة من العقار #${req.params.id}`,
      metadata: { image_id: Number(req.params.imageId) },
      ...auditMeta(req),
    });
    return res
      .status(200)
      .json({ success: true, message: "تم حذف الصورة بنجاح" });
  } catch (error) {
    next(error);
  }
};

const setPrimaryImage = async (req, res, next) => {
  try {
    const image = await adminModel.setPropertyImagePrimary(
      req.params.id,
      req.params.imageId,
      {
        adminId: req.user.id,
        action: "SET_PRIMARY_PROPERTY_IMAGE",
        entityType: "property",
        description: `تم تعيين الصورة الرئيسية للعقار #${req.params.id}`,
        metadata: { image_id: Number(req.params.imageId) },
        ...auditMeta(req),
      }
    );
    if (!image) {
      return res
        .status(404)
        .json({ success: false, error: { message: "الصورة غير موجودة" } });
    }
    return res.status(200).json({ success: true, data: image });
  } catch (error) {
    next(error);
  }
};

// ─── Admin Settings ───────────────────────────────────────────────────

const getProfile = async (req, res, next) => {
  try {
    const profile = await adminModel.getAdminProfile(req.user.id);
    if (!profile) {
      return res
        .status(404)
        .json({ success: false, error: { message: "المستخدم غير موجود" } });
    }
    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const profile = await adminModel.updateAdminProfile(req.user.id, req.body);
    if (!profile) {
      return res
        .status(404)
        .json({ success: false, error: { message: "المستخدم غير موجود" } });
    }
    await createAuditLog({
      adminId: req.user.id,
      action: "UPDATE_ADMIN_PROFILE",
      entityType: "client",
      entityId: req.user.id,
      description: "تم تعديل الملف الشخصي للمسؤول",
      metadata: { fields: Object.keys(req.body).filter((k) => req.body[k] !== undefined) },
      ...auditMeta(req),
    });
    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, error: { message: "كلمتا المرور الحالية والجديدة مطلوبتان" } });
    }
    const result = await adminModel.changeAdminPassword(
      req.user.id,
      currentPassword,
      newPassword
    );
    if (result.error) {
      return res
        .status(400)
        .json({ success: false, error: { message: result.error } });
    }
    await createAuditLog({
      adminId: req.user.id,
      action: "CHANGE_ADMIN_PASSWORD",
      entityType: "client",
      entityId: req.user.id,
      description: "تم تغيير كلمة مرور المسؤول",
      ...auditMeta(req),
    });
    return res
      .status(200)
      .json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
  } catch (error) {
    next(error);
  }
};

export default {
  getStats,
  getAnalytics,
  listProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  uploadImages,
  deleteImage,
  setPrimaryImage,
  listClients,
  getClient,
  updateClient,
  deleteClient,
  listAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  listInquiries,
  listContacts,
  listSubscribers,
  getProfile,
  updateProfile,
  changePassword,
};
