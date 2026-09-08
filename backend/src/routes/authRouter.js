import express from "express";
import authControllers from "../controllers/authControllers.js";
import {
  validateLoginData,
  validateRegisterData,
} from "../middlewares/validators.js";
import { isAuthenticated } from "../middlewares/authMiddlewares.js";
const router = express();

router.post(
  "/register",
  validateRegisterData,
  authControllers.registerController
);

router.post("/login", validateLoginData, authControllers.loginController);
router.post("/logout", authControllers.logoutController);
router.get("/me", isAuthenticated, authControllers.getMeController);

export default router;
