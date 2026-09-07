import express from "express";
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

const PgStore = connectPgSimple(session);
const sessionStore = new PgStore({
  pool: pool,
  tableName: "sessions",
  createTableIfMissing: false,
});
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
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
      maxAge: 1000 * 60 * 60 * 24,
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

app.use(errorHandler);

export default app;
