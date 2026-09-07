import express from "express";
import contactController from "../controllers/contactController.js";
import { body, validationResult } from "express-validator";

const router = express.Router();

const validateContact = [
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
  body("message")
    .trim()
    .notEmpty()
    .withMessage("الرسالة مطلوبة")
    .isLength({ max: 5000 })
    .withMessage("الرسالة طويلة جدًا"),
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

router.post("/", validateContact, contactController.submit);

export default router;
