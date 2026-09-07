import request from "supertest";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { describe, expect } from "vitest";
import authRouter from "../routes/authRouter.js";

import { executeQuery } from "../utils/dbHelpers.js";
import pool from "../db/pool.js";
import { errorHandler } from "../middlewares/errorHandler.js";
import "../middlewares/passport.js";
const app = express();
import { vi } from "vitest";

const PgStore = connectPgSimple(session);
const sessionStore = new PgStore({
  pool: pool,
  tableName: "sessions",
  createTableIfMissing: false,
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
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

app.use("/auth", authRouter);

app.use(errorHandler);

const user = {
  id: 1,
  firstName: "Hayam",
  lastName: "Kamal",
  email: "hayammhmd90@gmail.com",
  password: "093A88#$$2a3",
  phone: "01050879165",
};
describe("Test Auth Routes", () => {
  beforeAll(async () => {
    // Clean database before tests
    await executeQuery(
      `TRUNCATE TABLE 
        sessions,
        clients
      RESTART IDENTITY CASCADE;`,
      [],
      "Earasing clients and sessions relations for testing"
    );
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(async () => {
    // Close pool after tests
    pool.end();
    console.warn.mockRestore();
    console.error.mockRestore();
  });

  test("should register a new user and log them in directly", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send(user)
      .set("Content-Type", "application/json")
      .expect("Content-Type", /json/)
      .expect(201);

    expect(res.body.data.user).toEqual(
      expect.objectContaining({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      })
    );
  });
  test("Should throw error when user already exists", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send(user)
      .set("Content-Type", "application/json")
      .expect("Content-Type", /json/)
      .expect(409);

    expect(res.body.error.message).toMatch(
      "User with this email already exists"
    );
  });
  test("Should login existing user successfully", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: user.email, password: user.password })
      .set("Content-Type", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body.data.user).toEqual(
      expect.objectContaining({
        id: user.id,
        firstName: user.firstName,
        email: user.email,
      })
    );
  });

  test("Should return error for invalid login", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "hayammhmd90@gmail.com", password: "wrongpassword" })
      .set("Content-Type", "application/json")
      .expect("Content-Type", /json/)
      .expect(401);

    console.log("Response status:", res.status);
    console.log("Response body:", res.body);
    console.log("Error message:", res.body.error || res.body.message);

    // Assertions
    expect(res.body).toHaveProperty("error"); // or 'message'
  });

  test("Should logout user successfully", async () => {
    const res = await request(app)
      .post("/auth/logout")
      .expect("Content-Type", /json/)
      .expect(200);

    // Fix: access the message from res.body, not res.message
    expect(res.body.message).toBe("User has successfully logged out");
    expect(res.body.success).toBe(true);
  });
});
