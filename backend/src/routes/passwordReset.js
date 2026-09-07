import express from "express";
import passwordResetController from "../controllers/passwordResetController.js";
import { body, validationResult } from "express-validator";

const router = express.Router();

const validateForgotPassword = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("البريد الإلكتروني مطلوب")
    .isEmail()
    .withMessage("صيغة البريد الإلكتروني غير صحيحة")
    .normalizeEmail(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

const validateResetPassword = [
  body("token")
    .trim()
    .notEmpty()
    .withMessage("الرمز مطلوب"),
  body("password")
    .notEmpty()
    .withMessage("كلمة المرور مطلوبة")
    .isLength({ min: 8 })
    .withMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم وحرف خاص"
    ),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

router.post(
  "/forgot-password",
  validateForgotPassword,
  passwordResetController.forgotPassword
);

router.post(
  "/reset-password",
  validateResetPassword,
  passwordResetController.resetPassword
);

export default router;
