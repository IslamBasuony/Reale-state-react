import dotenv from "dotenv";
dotenv.config();
import passport from "passport";
import authModel from "../models/authModel.js";
import { createAuditLog } from "../models/auditLogModel.js";
import "../middlewares/passport.js";

const registerController = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    const user = await authModel.registerModel({
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone,
      password: password,
    });
    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          isAdmin: Boolean(user.is_admin),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const loginController = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({
        success: false,
        error: info.message || "Invalid credentials",
      });
    }

    // Regenerate the session ID on login to prevent session fixation.
    req.session.regenerate((err) => {
      if (err) {
        return next(err);
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        if (user.is_admin) {
          createAuditLog({
            adminId: user.id,
            action: "ADMIN_LOGIN_SUCCESS",
            entityType: "client",
            entityId: user.id,
            description: `تم تسجيل دخول المسؤول "${user.email}"`,
            ip: req.ip,
            userAgent: req.headers["user-agent"] || null,
          }).catch(() => {});
        }
        return res.status(200).json({
          success: true,
          message: "Login successful",
          data: {
            user: {
              id: user.id,
              firstName: user.first_name,
              lastName: user.last_name,
              email: user.email,
              phone: user.phone,
              isAdmin: Boolean(user.is_admin),
            },
          },
        });
      });
    });
  })(req, res, next);
};

const getMeController = (req, res, next) => {
  try {
    const user = req.user;
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          isAdmin: Boolean(user.is_admin),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const logoutController = async (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie("connect.sid", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      res
        .status(200)
        .json({ success: true, message: "User has successfully logged out" });
    });
  });
};
// // TODO DEFINE refreshController
// const refreshController = async (req, res, next) => {};
// // TODO DEFINE forgotPasswordController
// const forgotPasswordController = async (req, res, next) => {};
// // TODO DEFINE resetPasswordController
// const resetPasswordController = async (req, res, next) => {};

export default {
  registerController,
  loginController,
  logoutController,
  getMeController,
  // refreshController,
  // forgotPasswordController,
  // resetPasswordController,
};
