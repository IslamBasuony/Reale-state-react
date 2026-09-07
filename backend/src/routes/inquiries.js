import express from "express";
import inquiryController from "../controllers/inquiryController.js";
import { body, validationResult } from "express-validator";

const router = express.Router({ mergeParams: true });

const validateInquiry = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("الاسم مطلوب")
    .isLength({ max: 100 })
    .withMessage("الاسم طويل جدًا"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("البريد الإلكتروني مطلوب")
    .isEmail()
    .withMessage("صيغة البريد الإلكتروني غير صحيحة")
    .normalizeEmail(),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("رقم الهاتف مطلوب")
    .isLength({ max: 20 })
    .withMessage("رقم الهاتف طويل جدًا"),
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

router.post("/", validateInquiry, inquiryController.submit);

export default router;
