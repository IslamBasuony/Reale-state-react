export class AppError extends Error {
  constructor(message, status = 500, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
    this.name = "AppError";
    this.userMessage = message;

    // Preserve the original error for server-side logging only — never sent to clients
    if (extra.originalError instanceof Error) {
      this.cause = extra.originalError;

      this.originalError = {
        message: extra.originalError.message,
        name: extra.originalError.name,
        code: extra.originalError.code,
        detail: extra.originalError.detail,
        constraint: extra.originalError.constraint,
      };

      Error.captureStackTrace(this, this.constructor);
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input", extra = {}) {
    super(message, 400, extra);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class AuthError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}
