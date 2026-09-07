import request from "supertest";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { describe, expect } from "vitest";
import router from "../routes/index.js";
import authRouter from "../routes/authRouter.js";
import pool from "../db/pool.js";
import { errorHandler } from "../middlewares/errorHandler.js";
import { executeQuery } from "../utils/dbHelpers.js";
import { vi } from "vitest";
import "../middlewares/passport.js";
const app = express({ mergeParams: true });

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

app.use("/api", router);
app.use("/auth", authRouter);

app.use(errorHandler);

/**
 * ----------------------- Test Suit -----------------------
 */
describe("Test getting properties route", () => {
  test("Should get all Arabic properties", async () => {
    await request(app)
      .get("/api/ar/listings")
      .expect("Content-Type", /json/)
      .expect(200);
  });

  test("Should get all English properties", async () => {
    await request(app)
      .get("/api/en/listings")
      .expect("Content-Type", /json/)
      .expect(200);
  });

  test("Should throw error if language isn't supported", async () => {
    const res = await request(app)
      .get("/api/gr/listings")
      .expect("Content-Type", /json/)
      .expect(406);

    expect(res.body.error.message).toMatch(
      "Invalid 'lang' parameter Supported values are 'en' or 'ar'"
    );
  });
});
/**
 * ----------------------- Test Suit -----------------------
 */
describe("Test brokers route", () => {
  test("Should get all active brokers without password", async () => {
    const res = await request(app)
      .get("/api/brokers")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((broker) => {
      expect(broker).not.toHaveProperty("password");
      expect(broker.is_active).toBe(true);
    });
  });

  test("Should get broker by valid id", async () => {
    const allRes = await request(app).get("/api/brokers").expect(200);
    const brokerId = allRes.body.data[0].id;

    const res = await request(app)
      .get(`/api/brokers/${brokerId}`)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(brokerId);
    expect(res.body.data).not.toHaveProperty("password");
  });

  test("Should return 404 for invalid broker id", async () => {
    const res = await request(app)
      .get("/api/brokers/999999")
      .expect("Content-Type", /json/)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch("Broker id isn't valid");
  });
});

/**
 * ----------------------- Test Suit -----------------------
 */

describe("Test Authorization for users/:id router", () => {
  let cookie;
  let user;
  const regData = {
    firstName: "Lara",
    lastName: "gamal",
    email: "laragamal@yahoo.com",
    password: "02938lkslpKKe##%4",
    phone: "01129247261",
  };

  beforeAll(async () => {
    // 1. Register a test user
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
    await request(app)
      .post("/auth/register")
      .send(regData)
      .set("Content-Type", "application/json")
      .expect("Content-Type", /json/)
      .expect(201);

    // 2. Login to get session cookie
    const loginRes = await request(app)
      .post("/auth/login")
      .send({
        email: regData.email,
        password: regData.password,
      })
      .set("Content-Type", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    cookie = loginRes.headers["set-cookie"]
      .find((c) => c.startsWith("connect.sid"))
      .split(";")[0]; // keeps only "connect.sid=somevalue"
    user = loginRes.body.data.user;
  });

  afterAll(async () => {
    // Clean up: delete test user from database
    await pool.end();
    await request(app).delete(`/api/users/2`).set("Cookie", cookie);
    console.warn.mockRestore();
    console.error.mockRestore();
  });

  test("Should get user data when authenticated", async () => {
    const res = await request(app)
      .get(`/api/users/${user.id}`)
      .set("Cookie", cookie) // ← Send the session cookie
      .expect(200);
    console.log(`the possible sturcture of res ${res.body}, ${res.body.data}`);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.id).toBe(user.id);
    expect(res.body.data.user.email).toBe(user.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  test("GET /auth/me returns the authenticated user without password", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Cookie", cookie)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.id).toBe(user.id);
    expect(res.body.data.user.email).toBe(user.email);
    expect(res.body.data.user).not.toHaveProperty("password");
  });

  test("GET /auth/me returns 401 when not authenticated", async () => {
    const res = await request(app).get("/auth/me").expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(
      "You are unauthorized to view this resource"
    );
  });

  //   it("Should return 401 when not authenticated", async () => {
  //     const response = await request(app)
  //       .get(`/users/${testUser.id}`)
  //       // No cookie sent!
  //       .expect(401);

  //     expect(response.body.success).toBe(false);
  //     expect(response.body.error.message).toMatch(
  //       "You are unauthorized to view this resource"
  //     );
  //   });

  //   it("Should return 403 when trying to access another user's data", async () => {
  //     // Try to access user with ID that's not ours
  //     const otherUserId = testUser.id + 999;

  //     const response = await request(app)
  //       .get(`/users/${otherUserId}`)
  //       .set("Cookie", sessionCookie)
  //       .expect(403);

  //     expect(response.body.success).toBe(false);
  //     expect(response.body.error.message).toMatch(
  //       "You are forbidden from accessing this resource"
  //     );
  //   });

  //   // it("Should allow user to update their own profile", async () => {
  //   //   const response = await request(app)
  //   //     .put(`/api/users/${testUser.id}`)
  //   //     .set("Cookie", sessionCookie)
  //   //     .send({
  //   //       firstName: "Updated",
  //   //       lastName: "Name",
  //   //     })
  //   //     .expect(200);

  //   //   expect(response.body.success).toBe(true);
  //   //   expect(response.body.data.user.firstName).toBe("Updated");
  //   // });

  //   // it("Should not allow user to update another user's profile", async () => {
  //   //   const otherUserId = testUser.id + 999;

  //   //   const response = await request(app)
  //   //     .put(`/api/users/${otherUserId}`)
  //   //     .set("Cookie", sessionCookie)
  //   //     .send({
  //   //       firstName: "Hacked",
  //   //       lastName: "User",
  //   //     })
  //   //     .expect(403);

  //   //   expect(response.body.success).toBe(false);
  //   // });
});
