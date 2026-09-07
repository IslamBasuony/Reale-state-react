import express from "express";
import authControllers from "../controllers/authControllers.js";
import {
  validateLoginData,
  validateRegisterData,
} from "../middlewares/validators.js";
import { isAuthenticated } from "../middlewares/authMiddlewares.js";
const router = express();

// TODO test post routers and choose from postman or jest
router.post(
  "/register",
  validateRegisterData,
  authControllers.registerController
);

router.post("/login", validateLoginData, authControllers.loginController);
router.post("/logout", authControllers.logoutController);
router.get("/me", isAuthenticated, authControllers.getMeController);
// router.post("/refresh", authControllers.refreshController);
// router.post("/forgot-password", authControllers.forgotPasswordController);
// router.post("/reset-password", authControllers.resetPasswordController);

export default router;
