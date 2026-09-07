import request from "supertest";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { vi } from "vitest";
import router from "../routes/index.js";
import authRouter from "../routes/authRouter.js";
import adminRouter from "../routes/admin.js";
import pool from "../db/pool.js";
import { errorHandler } from "../middlewares/errorHandler.js";
import { executeQuery } from "../utils/dbHelpers.js";
import "../middlewares/passport.js";

const app = express();

const PgStore = connectPgSimple(session);
const sessionStore = new PgStore({
  pool,
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
app.use("/api/admin", adminRouter);

app.use(errorHandler);

// ─── Helpers ───────────────────────────────────────────────────────────

const REGULAR_USER = {
  firstName: "Test",
  lastName: "User",
  email: "test.admin@example.com",
  password: "Test@12345",
  phone: "01000000000",
};

const ADMIN_USER = {
  firstName: "Test",
  lastName: "Admin",
  email: "test.adminreal@example.com",
  password: "Admin@12345",
  phone: "01000000001",
};

let regularCookie;
let adminCookie;
let regularUserId;

// ─── Setup ─────────────────────────────────────────────────────────────

beforeAll(async () => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});

  // Clean slate for test users
  await executeQuery(
    `DELETE FROM clients WHERE email IN ($1, $2)`,
    [REGULAR_USER.email, ADMIN_USER.email],
    "test cleanup"
  );

  // Register regular user
  await request(app)
    .post("/auth/register")
    .send(REGULAR_USER)
    .set("Content-Type", "application/json")
    .expect(201);

  const regularLogin = await request(app)
    .post("/auth/login")
    .send({ email: REGULAR_USER.email, password: REGULAR_USER.password })
    .set("Content-Type", "application/json")
    .expect(200);

  regularCookie = regularLogin.headers["set-cookie"]
    .find((c) => c.startsWith("connect.sid"))
    .split(";")[0];
  regularUserId = regularLogin.body.data.user.id;

  // Register admin user
  await request(app)
    .post("/auth/register")
    .send(ADMIN_USER)
    .set("Content-Type", "application/json")
    .expect(201);

  // Promote to admin via direct DB update
  await executeQuery(
    `UPDATE clients SET is_admin = TRUE WHERE email = $1`,
    [ADMIN_USER.email],
    "promote test admin"
  );

  const adminLogin = await request(app)
    .post("/auth/login")
    .send({ email: ADMIN_USER.email, password: ADMIN_USER.password })
    .set("Content-Type", "application/json")
    .expect(200);

  adminCookie = adminLogin.headers["set-cookie"]
    .find((c) => c.startsWith("connect.sid"))
    .split(";")[0];
});

afterAll(async () => {
  await executeQuery(
    `DELETE FROM clients WHERE email IN ($1, $2)`,
    [REGULAR_USER.email, ADMIN_USER.email],
    "test cleanup after"
  );
  console.warn.mockRestore();
  console.error.mockRestore();
  await pool.end();
});

// ─── Authentication tests ──────────────────────────────────────────────

describe("Admin API — Authentication", () => {
  test("GET /api/admin/stats returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/admin/stats").expect(401);

    expect(res.body.success).toBe(false);
  });

  test("GET /api/admin/stats returns 403 for regular (non-admin) user", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Cookie", regularCookie)
      .expect(403);

    expect(res.body.success).toBe(false);
  });

  test("GET /api/admin/stats returns 200 for admin user", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("totalProperties");
    expect(res.body.data).toHaveProperty("totalClients");
    expect(res.body.data).toHaveProperty("totalAgents");
    expect(res.body.data).toHaveProperty("recentProperties");
    expect(res.body.data).toHaveProperty("recentUsers");
  });
});

// ─── Properties admin endpoints ────────────────────────────────────────

describe("Admin API — Properties", () => {
  let createdPropertyId;

  test("GET /api/admin/properties returns 200 for admin", async () => {
    const res = await request(app)
      .get("/api/admin/properties")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("properties");
    expect(res.body.data).toHaveProperty("total");
    expect(res.body.data).toHaveProperty("page");
    expect(res.body.data).toHaveProperty("totalPages");
    expect(Array.isArray(res.body.data.properties)).toBe(true);
  });

  test("GET /api/admin/properties returns 403 for regular user", async () => {
    await request(app)
      .get("/api/admin/properties")
      .set("Cookie", regularCookie)
      .expect(403);
  });

  test("POST /api/admin/properties creates a property", async () => {
    // Get first agent to use as agent_id
    const agentsRes = await request(app)
      .get("/api/admin/agents")
      .set("Cookie", adminCookie)
      .expect(200);

    const agentId = agentsRes.body.data.agents[0]?.id;
    if (!agentId) return;

    const res = await request(app)
      .post("/api/admin/properties")
      .set("Cookie", adminCookie)
      .send({
        title: "Admin Test Property",
        price: 1500000,
        address: "Test Address, Cairo",
        purpose: "sale",
        type: "apartment",
        lang: "ar",
        agent_id: agentId,
        bedrooms_number: 3,
        bathrooms_number: 2,
        area_size: 150,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.title).toBe("Admin Test Property");
    createdPropertyId = res.body.data.id;
  });

  test("GET /api/admin/properties/:id returns the created property", async () => {
    if (!createdPropertyId) return;
    const res = await request(app)
      .get(`/api/admin/properties/${createdPropertyId}`)
      .set("Cookie", adminCookie)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdPropertyId);
    expect(res.body.data.title).toBe("Admin Test Property");
  });

  test("PUT /api/admin/properties/:id updates the property", async () => {
    if (!createdPropertyId) return;
    const res = await request(app)
      .put(`/api/admin/properties/${createdPropertyId}`)
      .set("Cookie", adminCookie)
      .send({ title: "Updated Test Property", price: 2000000 })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Updated Test Property");
    expect(Number(res.body.data.price)).toBe(2000000);
  });

  test("DELETE /api/admin/properties/:id deletes the property", async () => {
    if (!createdPropertyId) return;
    await request(app)
      .delete(`/api/admin/properties/${createdPropertyId}`)
      .set("Cookie", adminCookie)
      .expect(200);

    // Verify it's gone
    await request(app)
      .get(`/api/admin/properties/${createdPropertyId}`)
      .set("Cookie", adminCookie)
      .expect(404);
  });

  test("POST /api/admin/properties returns 400 with invalid data", async () => {
    await request(app)
      .post("/api/admin/properties")
      .set("Cookie", adminCookie)
      .send({ title: "" })
      .expect(400);
  });
});

// ─── Users/Clients admin endpoints ─────────────────────────────────────

describe("Admin API — Users", () => {
  test("GET /api/admin/users returns 200 for admin", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("clients");
    expect(res.body.data).toHaveProperty("total");
    expect(Array.isArray(res.body.data.clients)).toBe(true);

    // Ensure no password is returned
    res.body.data.clients.forEach((client) => {
      expect(client).not.toHaveProperty("password");
    });
  });

  test("GET /api/admin/users returns 403 for regular user", async () => {
    await request(app)
      .get("/api/admin/users")
      .set("Cookie", regularCookie)
      .expect(403);
  });

  test("GET /api/admin/users/:id returns the user without password", async () => {
    const res = await request(app)
      .get(`/api/admin/users/${regularUserId}`)
      .set("Cookie", adminCookie)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(regularUserId);
    expect(res.body.data).not.toHaveProperty("password");
  });

  test("PUT /api/admin/users/:id updates user fields", async () => {
    const res = await request(app)
      .put(`/api/admin/users/${regularUserId}`)
      .set("Cookie", adminCookie)
      .send({ phone: "01111111111" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.phone).toBe("01111111111");
  });
});

// ─── Agents admin endpoints ────────────────────────────────────────────

describe("Admin API — Agents", () => {
  let createdAgentId;

  test("GET /api/admin/agents returns 200 for admin", async () => {
    const res = await request(app)
      .get("/api/admin/agents")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("agents");
    expect(Array.isArray(res.body.data.agents)).toBe(true);

    // Ensure no password is returned
    res.body.data.agents.forEach((agent) => {
      expect(agent).not.toHaveProperty("password");
    });
  });

  test("GET /api/admin/agents returns 403 for regular user", async () => {
    await request(app)
      .get("/api/admin/agents")
      .set("Cookie", regularCookie)
      .expect(403);
  });

  test("POST /api/admin/agents creates an agent", async () => {
    const res = await request(app)
      .post("/api/admin/agents")
      .set("Cookie", adminCookie)
      .send({
        first_name: "Test",
        last_name: "Agent",
        phone: "01234567890",
        email: "test.agent.admin@example.com",
        password: "Agent@12345",
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data).not.toHaveProperty("password");
    createdAgentId = res.body.data.id;
  });

  test("GET /api/admin/agents/:id returns the agent", async () => {
    if (!createdAgentId) return;
    const res = await request(app)
      .get(`/api/admin/agents/${createdAgentId}`)
      .set("Cookie", adminCookie)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdAgentId);
    expect(res.body.data).not.toHaveProperty("password");
  });

  test("DELETE /api/admin/agents/:id deletes the agent", async () => {
    if (!createdAgentId) return;
    await request(app)
      .delete(`/api/admin/agents/${createdAgentId}`)
      .set("Cookie", adminCookie)
      .expect(200);
  });
});

// ─── Inquiries / Contacts / Newsletter ─────────────────────────────────

describe("Admin API — Inquiries, Contacts, Subscribers", () => {
  test("GET /api/admin/inquiries returns 200 for admin", async () => {
    const res = await request(app)
      .get("/api/admin/inquiries")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("inquiries");
    expect(res.body.data).toHaveProperty("total");
  });

  test("GET /api/admin/contacts returns 200 for admin", async () => {
    const res = await request(app)
      .get("/api/admin/contacts")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("contacts");
    expect(res.body.data).toHaveProperty("total");
  });

  test("GET /api/admin/subscribers returns 200 for admin", async () => {
    const res = await request(app)
      .get("/api/admin/subscribers")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("subscribers");
    expect(res.body.data).toHaveProperty("total");
  });

  test("All three return 403 for regular user", async () => {
    await request(app)
      .get("/api/admin/inquiries")
      .set("Cookie", regularCookie)
      .expect(403);
    await request(app)
      .get("/api/admin/contacts")
      .set("Cookie", regularCookie)
      .expect(403);
    await request(app)
      .get("/api/admin/subscribers")
      .set("Cookie", regularCookie)
      .expect(403);
  });
});
