export const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  const isDev = process.env.NODE_ENV === "development";

  // Determine safe message — never expose internals in production
  let message;
  if (isDev) {
    message = err.message || "Internal Server Error";
  } else {
    // In production, strip anything after " | Original:" (AppError cause chain)
    const raw = err.message || "Internal Server Error";
    message = raw.split(" | Original:")[0] || "Internal Server Error";
  }

  // Base response
  const response = {
    success: false,
    error: {
      message,
      code: err.code || "INTERNAL_ERROR",
    },
  };

  // Handle PostgreSQL errors
  const pgErrors = {
    23505: { status: 409, message: "Resource already exists" },
    23503: { status: 400, message: "Referenced resource not found" },
    23502: { status: 400, message: "Required field missing" },
    "22P02": { status: 400, message: "Invalid data format" },
    "42P01": { status: 500, message: "An internal error occurred" },
  };

  if (err.code && pgErrors[err.code]) {
    status = pgErrors[err.code].status;
    response.error.message = pgErrors[err.code].message;
  }

  // Development-only details
  if (isDev) {
    response.stack = err.stack;
    response.type = err.constructor.name;

    if (err.cause) {
      response.cause = {
        message: err.cause.message,
        stack: err.cause.stack,
        type: err.cause.constructor ? err.cause.constructor.name : "Error",
        code: err.cause.code,
      };
    }

    if (err.detail) {
      response.technicalDetails = err.detail;
      response.constraint = err.constraint;
    }
  }

  // Logging (server-side only — never sent to client)
  if (status >= 500) {
    console.error("Server Error:", {
      message: err.message,
      status,
      code: err.code,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  } else if (status >= 400) {
    console.warn("Client Error:", {
      message,
      status,
      url: req.originalUrl,
      method: req.method,
    });
  }

  res.status(status).json(response);
};
