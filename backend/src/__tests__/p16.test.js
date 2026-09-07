import request from "supertest";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { describe, expect, test, beforeAll } from "vitest";

import newsletterRouter from "../routes/newsletter.js";
import contactRouter from "../routes/contact.js";
import inquiriesRouter from "../routes/inquiries.js";
import passwordResetRouter from "../routes/passwordReset.js";
import authRouter from "../routes/authRouter.js";
import adminRouter from "../routes/admin.js";
import { executeQuery } from "../utils/dbHelpers.js";
import pool from "../db/pool.js";
import { errorHandler } from "../middlewares/errorHandler.js";
import "../middlewares/passport.js";

const app = express();
const PgStore = connectPgSimple(session);
const sessionStore = new PgStore({
  pool: pool,
  tableName: "sessions",
  createTableIfMissing: false,
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(helmet());
app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      sameSite: "strict",
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/api/newsletter", newsletterRouter);
app.use("/api/contact", contactRouter);
app.use("/api/projects/:id/inquiries", inquiriesRouter);
app.use("/auth", authRouter);
app.use("/auth", passwordResetRouter);
app.use("/api/admin", adminRouter);
app.use(errorHandler);

const testUser = {
  firstName: "Test",
  lastName: "Admin",
  email: "p16test@example.com",
  password: "StrongPass1!",
  phone: "01012345678",
};

describe("P16 — Newsletter API", () => {
  beforeAll(async () => {
    await executeQuery("DELETE FROM newsletter_subscribers WHERE email = $1", ["test@example.com"], "cleanup");
  });

  test("POST /api/newsletter — valid subscription", async () => {
    const res = await request(app)
      .post("/api/newsletter")
      .send({ email: "test@example.com" })
      .expect("Content-Type", /json/)
      .expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe("test@example.com");
  });

  test("POST /api/newsletter — duplicate email returns 201 (upsert)", async () => {
    const res = await request(app)
      .post("/api/newsletter")
      .send({ email: "test@example.com" })
      .expect(201);
    expect(res.body.success).toBe(true);
  });

  test("POST /api/newsletter — invalid email", async () => {
    const res = await request(app)
      .post("/api/newsletter")
      .send({ email: "not-an-email" })
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/newsletter — empty email", async () => {
    const res = await request(app)
      .post("/api/newsletter")
      .send({})
      .expect(400);
    expect(res.body.success).toBe(false);
  });
});

describe("P16 — Contact API", () => {
  const contactData = {
    name: "أحمد علي",
    email: "ahmed@test.com",
    phone: "01012345678",
    message: "أريد الاستفسار عن عقار في القاهرة.",
  };

  test("POST /api/contact — valid submission", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send(contactData)
      .expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
  });

  test("POST /api/contact — missing required fields", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "test" })
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/contact — invalid email", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ ...contactData, email: "bad" })
      .expect(400);
    expect(res.body.success).toBe(false);
  });
});

describe("P16 — Project Inquiry API", () => {
  test("POST /api/projects/:id/inquiries — valid submission", async () => {
    const res = await request(app)
      .post("/api/projects/project-1/inquiries")
      .send({ name: "محمد", email: "mohamed@test.com", phone: "01098765432" })
      .expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
  });

  test("POST /api/projects/:id/inquiries — missing fields", async () => {
    const res = await request(app)
      .post("/api/projects/project-1/inquiries")
      .send({ name: "test" })
      .expect(400);
    expect(res.body.success).toBe(false);
  });
});

describe("P16 — Password Reset API", () => {
  beforeAll(async () => {
    await executeQuery(
      `TRUNCATE TABLE sessions, clients RESTART IDENTITY CASCADE`,
      [],
      "cleanup for password reset tests"
    );
    await request(app)
      .post("/auth/register")
      .send(testUser)
      .expect(201);
  });

  test("POST /auth/forgot-password — always returns same response", async () => {
    const res = await request(app)
      .post("/auth/forgot-password")
      .send({ email: testUser.email })
      .expect(200);
    expect(res.body.success).toBe(true);
  });

  test("POST /auth/forgot-password — unknown email returns same response", async () => {
    const res = await request(app)
      .post("/auth/forgot-password")
      .send({ email: "unknown@example.com" })
      .expect(200);
    expect(res.body.success).toBe(true);
  });

  test("POST /auth/forgot-password — invalid email format", async () => {
    const res = await request(app)
      .post("/auth/forgot-password")
      .send({ email: "bad" })
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  test("POST /auth/forgot-password — empty body", async () => {
    const res = await request(app)
      .post("/auth/forgot-password")
      .send({})
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  test("POST /auth/reset-password — invalid token", async () => {
    const res = await request(app)
      .post("/auth/reset-password")
      .send({ token: "invalid-token", password: "NewPass1!@" })
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  test("POST /auth/reset-password — weak password", async () => {
    const res = await request(app)
      .post("/auth/reset-password")
      .send({ token: "some-token", password: "weak" })
      .expect(400);
    expect(res.body.success).toBe(false);
  });
});

describe("P16 — Admin Middleware", () => {
  test("GET /api/admin/users/:id — unauthenticated returns 401", async () => {
    const res = await request(app)
      .get("/api/admin/users/1")
      .expect(401);
    expect(res.body.success).toBe(false);
  });
});
