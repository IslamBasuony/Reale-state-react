import { AppError } from "../utils/customErrors.js";

// Middleware: user must be authenticated AND have is_admin = true.
// Must be placed AFTER passport.session().
export const isAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next(new AppError("غير مصرح", 401));
  }
  if (!req.user.is_admin) {
    return next(new AppError("ممنوع — الصلاحية مطلوبة", 403));
  }
  next();
};
