import express from "express";
import compression from "compression";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import helmet from "helmet";
import cors from "cors";
import passport from "passport";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();
import pool from "./src/db/pool.js";
import { JSON_BODY_LIMIT, SESSION_MAX_AGE_MS } from "./src/utils/constants.js";
import { errorHandler } from "./src/middlewares/errorHandler.js";

import authRouter from "./src/routes/authRouter.js";
import mainRouter from "./src/routes/index.js";
import newsletterRouter from "./src/routes/newsletter.js";
import contactRouter from "./src/routes/contact.js";
import inquiriesRouter from "./src/routes/inquiries.js";
import passwordResetRouter from "./src/routes/passwordReset.js";
import adminRouter from "./src/routes/admin.js";
import { authLimiter, passwordResetLimiter, apiLimiter } from "./src/middlewares/rateLimiter.js";

import "./src/middlewares/passport.js";

// Fail fast if critical secrets are missing
if (!process.env.SESSION_SECRET_KEY) {
  console.error("FATAL: SESSION_SECRET_KEY environment variable is required");
  process.exit(1);
}

const app = express();

// Trust first proxy (needed for req.ip behind reverse proxies)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Public liveness probe — no secrets, no stack traces
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

const PgStore = connectPgSimple(session);
const sessionStore = new PgStore({
  pool: pool,
  tableName: "sessions",
  createTableIfMissing: false,
});
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));
app.use(compression());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(helmet());
app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE_MS,
      httpOnly: true,
      sameSite: "strict",
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads"), { dotfiles: "deny" }));

app.use("/api", apiLimiter, mainRouter);
app.use("/api/newsletter", apiLimiter, newsletterRouter);
app.use("/api/contact", apiLimiter, contactRouter);
app.use("/api/projects/:id/inquiries", apiLimiter, inquiriesRouter);
app.use("/auth", authLimiter, authRouter);
app.use("/auth", passwordResetLimiter, passwordResetRouter);
app.use("/api/admin", apiLimiter, adminRouter);

if (process.env.NODE_ENV === "production") {
  // Same-origin deployment: serve the built React SPA from Express.
  // Frontend and API share one origin so session cookies (SameSite=strict,
  // Secure) and the relative /api and /auth routes work without a reverse proxy.
  const frontendBuild = path.join(__dirname, "../frontend/build");

  // API/auth paths that did not match a route respond as JSON, never SPA HTML.
  app.use(["/api", "/auth"], (req, res) => {
    res.status(404).json({
      success: false,
      error: { message: "Not found", code: "NOT_FOUND" },
    });
  });

  app.use(express.static(frontendBuild));

  // React Router history fallback for non-API GET requests.
  app.use((req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }
    if (
      req.path.startsWith("/api/") ||
      req.path.startsWith("/uploads/") ||
      req.path === "/api"
    ) {
      return next();
    }
    res.sendFile(path.join(frontendBuild, "index.html"));
  });
}

app.use(errorHandler);

export default app;
