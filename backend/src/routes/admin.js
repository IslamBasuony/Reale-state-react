import express from "express";
import { body, validationResult } from "express-validator";
import { isAdmin } from "../middlewares/adminMiddleware.js";
import { isAuthenticated } from "../middlewares/authMiddlewares.js";
import {
  validateIdParam,
  validateImageIdParam,
  validatePropertyUpdate,
  validateAgentUpdate,
  validateClientUpdate,
} from "../middlewares/validators.js";
import adminController from "../controllers/adminController.js";
import * as auditLogController from "../controllers/auditLogController.js";
import { uploadPropertyImages } from "../middlewares/upload.js";

const router = express.Router();

// All admin routes require authentication + admin role.
router.use(isAdmin);

// ─── Validation helpers ────────────────────────────────────────────────

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const validateProperty = [
  body("title").trim().notEmpty().withMessage("العنوان مطلوب"),
  body("price")
    .isFloat({ gt: 0 })
    .withMessage("السعر يجب أن يكون رقمًا موجبًا"),
  body("address").trim().notEmpty().withMessage("العنوان الفعلي مطلوب"),
  body("purpose")
    .isIn(["sale", "rent"])
    .withMessage("الغرض يجب أن يكون sale أو rent"),
  body("type")
    .isIn([
      "apartment", "villa", "duplex", "penthouse", "studio",
      "townhouse", "office", "shop", "warehouse", "land",
    ])
    .withMessage("نوع العقار غير صالح"),
  body("lang")
    .isIn(["ar", "en"])
    .withMessage("اللغة يجب أن تكون ar أو en"),
  body("agent_id")
    .isInt({ gt: 0 })
    .withMessage("معرف الوسيط مطلوب ويجب أن يكون رقمًا صحيحًا"),
  handleValidationErrors,
];

const validateAgent = [
  body("first_name")
    .trim()
    .notEmpty()
    .withMessage("الاسم الأول مطلوب")
    .isLength({ max: 50 }),
  body("last_name")
    .trim()
    .notEmpty()
    .withMessage("الاسم الأخير مطلوب")
    .isLength({ max: 50 }),
  body("phone").trim().notEmpty().withMessage("رقم الهاتف مطلوب"),
  body("email").trim().isEmail().withMessage("البريد الإلكتروني غير صحيح"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  handleValidationErrors,
];

// ─── Statistics ────────────────────────────────────────────────────────

router.get("/stats", adminController.getStats);
router.get("/analytics", adminController.getAnalytics);

// ─── Properties ────────────────────────────────────────────────────────

router.get("/properties", adminController.listProperties);
router.get("/properties/:id", validateIdParam, adminController.getProperty);
router.post("/properties", validateProperty, adminController.createProperty);
router.put("/properties/:id", validateIdParam, validatePropertyUpdate, adminController.updateProperty);
router.delete("/properties/:id", validateIdParam, adminController.deleteProperty);

// ─── Property Images ──────────────────────────────────────────────────

router.post(
  "/properties/:id/images",
  validateIdParam,
  uploadPropertyImages,
  adminController.uploadImages
);
router.delete(
  "/properties/:id/images/:imageId",
  validateIdParam,
  validateImageIdParam,
  adminController.deleteImage
);
router.put(
  "/properties/:id/images/:imageId/primary",
  validateIdParam,
  validateImageIdParam,
  adminController.setPrimaryImage
);

// ─── Clients ───────────────────────────────────────────────────────────

router.get("/users", adminController.listClients);
router.get("/users/:id", validateIdParam, adminController.getClient);
router.put("/users/:id", validateIdParam, validateClientUpdate, adminController.updateClient);
router.delete("/users/:id", validateIdParam, adminController.deleteClient);

// ─── Agents ────────────────────────────────────────────────────────────

router.get("/agents", adminController.listAgents);
router.get("/agents/:id", validateIdParam, adminController.getAgent);
router.post("/agents", validateAgent, adminController.createAgent);
router.put("/agents/:id", validateIdParam, validateAgentUpdate, adminController.updateAgent);
router.delete("/agents/:id", validateIdParam, adminController.deleteAgent);

// ─── Inquiries ─────────────────────────────────────────────────────────

router.get("/inquiries", adminController.listInquiries);

// ─── Contact Messages ──────────────────────────────────────────────────

router.get("/contacts", adminController.listContacts);

// ─── Newsletter Subscribers ────────────────────────────────────────────

router.get("/subscribers", adminController.listSubscribers);

// ─── Admin Settings ───────────────────────────────────────────────────

const validatePasswordChange = [
  body("currentPassword").notEmpty().withMessage("كلمة المرور الحالية مطلوبة"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم وحرف خاص"
    ),
  handleValidationErrors,
];

const validateProfileUpdate = [
  body("first_name")
    .trim()
    .notEmpty()
    .withMessage("الاسم الأول مطلوب")
    .isLength({ max: 50 }),
  body("last_name")
    .trim()
    .notEmpty()
    .withMessage("الاسم الأخير مطلوب")
    .isLength({ max: 50 }),
  body("email").trim().isEmail().withMessage("البريد الإلكتروني غير صحيح"),
  body("phone").trim().notEmpty().withMessage("رقم الهاتف مطلوب"),
  handleValidationErrors,
];

router.get("/settings/profile", isAuthenticated, adminController.getProfile);
router.put(
  "/settings/profile",
  isAuthenticated,
  validateProfileUpdate,
  adminController.updateProfile
);
router.put(
  "/settings/password",
  isAuthenticated,
  validatePasswordChange,
  adminController.changePassword
);

// ─── Audit Logs (read-only) ─────────────────────────────────────

router.get("/audit-logs", auditLogController.listAuditLogs);
router.get("/audit-logs/:id", validateIdParam, auditLogController.getAuditLog);

export default router;
