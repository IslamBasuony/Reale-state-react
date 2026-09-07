import { body, param, validationResult } from "express-validator";
import { AppError } from "../utils/customErrors.js";

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const validateLang = (req, res, next) => {
  const { lang } = req.params;

  if (lang !== "en" && lang !== "ar") {
    throw new AppError(
      "Invalid 'lang' parameter Supported values are 'en' or 'ar'",
      406,
      { valid_values: ["en", "ar"], error: "Not Acceptable" }
    );
  }

  next();
};

/******************************************************/

const validateRegisterData = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("First name can only constain letters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Last name can only constain letters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .toLowerCase(),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/
    )
    .withMessage("Please provide a valid phone number"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
    ),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    next();
  },
];

const validateLoginData = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .toLowerCase(),

  body("password").notEmpty().withMessage("Password is required"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    next();
  },
];

const validateIdParam = [
  param("id").isInt({ gt: 0 }).withMessage("المعرّف غير صالح"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

const validateImageIdParam = [
  param("imageId").isInt({ gt: 0 }).withMessage("معرّف الصورة غير صالح"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

const validatePropertyUpdate = [
  body("title").optional().trim().notEmpty().withMessage("العنوان لا يمكن أن يكون فارغًا"),
  body("price")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("السعر يجب أن يكون رقمًا موجبًا"),
  body("address").optional().trim().notEmpty().withMessage("العنوان الفعلي لا يمكن أن يكون فارغًا"),
  body("purpose")
    .optional()
    .isIn(["sale", "rent"])
    .withMessage("الغرض يجب أن يكون sale أو rent"),
  body("type")
    .optional()
    .isIn([
      "apartment", "villa", "duplex", "penthouse", "studio",
      "townhouse", "office", "shop", "warehouse", "land",
    ])
    .withMessage("نوع العقار غير صالح"),
  body("lang")
    .optional()
    .isIn(["ar", "en"])
    .withMessage("اللغة يجب أن تكون ar أو en"),
  body("agent_id")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("معرف الوسيط يجب أن быть صحيحًا موجبًا"),
  handleValidationErrors,
];

const validateAgentUpdate = [
  body("first_name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("الاسم الأول لا يمكن أن يكون فارغًا")
    .isLength({ max: 50 }),
  body("last_name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("الاسم الأخير لا يمكن أن يكون فارغًا")
    .isLength({ max: 50 }),
  body("phone").optional().trim().notEmpty().withMessage("رقم الهاتف لا يمكن أن يكون فارغًا"),
  body("email").optional().trim().isEmail().withMessage("البريد الإلكتروني غير صحيح"),
  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  handleValidationErrors,
];

const validateClientUpdate = [
  body("first_name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("الاسم الأول لا يمكن أن يكون فارغًا")
    .isLength({ max: 50 }),
  body("last_name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("الاسم الأخير لا يمكن أن يكون فارغًا")
    .isLength({ max: 50 }),
  body("email").optional().trim().isEmail().withMessage("البريد الإلكتروني غير صحيح"),
  body("phone").optional().trim().notEmpty().withMessage("رقم الهاتف لا يمكن أن يكون فارغًا"),
  body("is_admin").optional().isBoolean().withMessage("is_admin يجب أن يكون منطقيًا"),
  handleValidationErrors,
];

export {
  validateLang,
  validateRegisterData,
  validateLoginData,
  validateIdParam,
  validateImageIdParam,
  validatePropertyUpdate,
  validateAgentUpdate,
  validateClientUpdate,
};
