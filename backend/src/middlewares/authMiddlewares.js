import { AppError } from "../utils/customErrors.js";

// middleware/isAuthenticated.js
export const isAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next(
      new AppError("You are unauthorized to view this resource", 401)
    );
  }
  next();
};

// middleware/isAuthorized.js
export const isAuthorized = (req, res, next) => {
  // Check authentication first
  if (!req.isAuthenticated()) {
    return next(
      new AppError("You are unauthorized to view this resource", 401)
    );
  }

  // Check authorization
  const requestedUserId = parseInt(req.params.id);
  const loggedInUserId = req.user.id;

  if (loggedInUserId !== requestedUserId) {
    return next(
      new AppError("You are forbidden from accessing this resource", 403)
    );
  }

  next();
};

// Usage - just one middleware needed
