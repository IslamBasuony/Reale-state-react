import express from "express";
import newsletterController from "../controllers/newsletterController.js";
import { body, validationResult } from "express-validator";

const router = express.Router();

const validateNewsletter = [
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
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    next();
  },
];

router.post("/", validateNewsletter, newsletterController.subscribe);

export default router;
