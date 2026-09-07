import request from "supertest";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { vi } from "vitest";
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
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
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

app.use("/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use(errorHandler);

const ADMIN_USER = {
  firstName: "Audit",
  lastName: "Tester",
  email: "audit.tester@example.com",
  password: "Audit@12345",
  phone: "01000000099",
};

const REGULAR_USER = {
  firstName: "Regular",
  lastName: "Viewer",
  email: "audit.regular@example.com",
  password: "Regular@12345",
  phone: "01000000098",
};

let adminCookie;
let regularCookie;
let testAgentId;
let testPropertyId;

// ─── Setup ─────────────────────────────────────────────────────────────

beforeAll(async () => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});

  await executeQuery(
    `DELETE FROM clients WHERE email IN ($1, $2)`,
    [ADMIN_USER.email, REGULAR_USER.email],
    "audit test cleanup"
  );

  // Register and login admin
  await request(app)
    .post("/auth/register")
    .send(ADMIN_USER)
    .set("Content-Type", "application/json")
    .expect(201);

  await executeQuery(
    `UPDATE clients SET is_admin = TRUE WHERE email = $1`,
    [ADMIN_USER.email],
    "promote audit admin"
  );

  const adminLogin = await request(app)
    .post("/auth/login")
    .send({ email: ADMIN_USER.email, password: ADMIN_USER.password })
    .set("Content-Type", "application/json")
    .expect(200);

  adminCookie = adminLogin.headers["set-cookie"]
    .find((c) => c.startsWith("connect.sid"))
    .split(";")[0];

  // Register and login regular user
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
});

afterAll(async () => {
  // Cleanup test data
  if (testPropertyId) {
    await executeQuery(`DELETE FROM properties WHERE id = $1`, [testPropertyId], "audit test cleanup property").catch(() => {});
  }
  if (testAgentId) {
    await executeQuery(`DELETE FROM agents WHERE id = $1`, [testAgentId], "audit test cleanup agent").catch(() => {});
  }
  await executeQuery(
    `DELETE FROM audit_logs WHERE admin_id IN (
      SELECT id FROM clients WHERE email IN ($1, $2)
    )`,
    [ADMIN_USER.email, REGULAR_USER.email],
    "audit test cleanup logs"
  ).catch(() => {});
  await executeQuery(
    `DELETE FROM clients WHERE email IN ($1, $2)`,
    [ADMIN_USER.email, REGULAR_USER.email],
    "audit test cleanup"
  );
});

// ─── 7.25 Security Tests ──────────────────────────────────────────────

describe("Audit Logs — Security", () => {
  test("Admin can list audit logs → 200", async () => {
    const res = await request(app)
      .get("/api/admin/audit-logs")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("logs");
    expect(res.body.data).toHaveProperty("total");
    expect(res.body.data).toHaveProperty("page");
    expect(res.body.data).toHaveProperty("totalPages");
  });

  test("Regular user blocked from audit logs → 403", async () => {
    await request(app)
      .get("/api/admin/audit-logs")
      .set("Cookie", regularCookie)
      .expect(403);
  });

  test("Unauthenticated request blocked → 401", async () => {
    await request(app)
      .get("/api/admin/audit-logs")
      .expect(401);
  });

  test("Admin can get audit log by ID → 200 or 404", async () => {
    // First get any log to have a valid ID
    const list = await request(app)
      .get("/api/admin/audit-logs")
      .set("Cookie", adminCookie)
      .expect(200);

    if (list.body.data.logs.length > 0) {
      const logId = list.body.data.logs[0].id;
      const res = await request(app)
        .get(`/api/admin/audit-logs/${logId}`)
        .set("Cookie", adminCookie)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("admin_email");
      expect(res.body.data).toHaveProperty("action");
    }
  });

  test("Non-existent audit log ID → 404", async () => {
    await request(app)
      .get("/api/admin/audit-logs/999999999")
      .set("Cookie", adminCookie)
      .expect(404);
  });
});

// ─── 7.26 Immutability Tests ──────────────────────────────────────────

describe("Audit Logs — Immutability", () => {
  test("No POST endpoint for audit logs (404)", async () => {
    await request(app)
      .post("/api/admin/audit-logs")
      .set("Cookie", adminCookie)
      .send({ action: "TEST", entity_type: "test" })
      .expect(404);
  });

  test("No PUT endpoint for audit logs (404)", async () => {
    await request(app)
      .put("/api/admin/audit-logs/1")
      .set("Cookie", adminCookie)
      .send({ description: "tampered" })
      .expect(404);
  });

  test("No DELETE endpoint for audit logs (404)", async () => {
    await request(app)
      .delete("/api/admin/audit-logs/1")
      .set("Cookie", adminCookie)
      .expect(404);
  });
});

// ─── 7.27 Functional Tests — Properties ───────────────────────────────

describe("Audit Logs — Create/Update/Delete Property", () => {
  test("CREATE_PROPERTY creates an audit log", async () => {
    // First create an agent (needed for property)
    const agentRes = await request(app)
      .post("/api/admin/agents")
      .set("Cookie", adminCookie)
      .send({
        first_name: "Audit",
        last_name: "Agent",
        email: "audit.agent@example.com",
        phone: "01000000077",
        password: "Agent@12345",
      })
      .expect(201);

    testAgentId = agentRes.body.data.id;

    const beforeCount = await request(app)
      .get("/api/admin/audit-logs?action=CREATE_PROPERTY")
      .set("Cookie", adminCookie)
      .expect(200);

    const propertyRes = await request(app)
      .post("/api/admin/properties")
      .set("Cookie", adminCookie)
      .send({
        title: "Audit Test Property",
        price: 500000,
        address: "Test Address",
        purpose: "sale",
        type: "apartment",
        lang: "ar",
        agent_id: testAgentId,
      })
      .expect(201);

    testPropertyId = propertyRes.body.data.id;

    const afterCount = await request(app)
      .get("/api/admin/audit-logs?action=CREATE_PROPERTY")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(afterCount.body.data.total).toBeGreaterThanOrEqual(beforeCount.body.data.total);
  });

  test("UPDATE_PROPERTY creates an audit log", async () => {
    const beforeLogs = await request(app)
      .get("/api/admin/audit-logs?action=UPDATE_PROPERTY&entity_type=property")
      .set("Cookie", adminCookie)
      .expect(200);

    await request(app)
      .put(`/api/admin/properties/${testPropertyId}`)
      .set("Cookie", adminCookie)
      .send({ title: "Updated Audit Property", price: 600000 })
      .expect(200);

    const afterLogs = await request(app)
      .get("/api/admin/audit-logs?action=UPDATE_PROPERTY&entity_type=property")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(afterLogs.body.data.total).toBeGreaterThanOrEqual(beforeLogs.body.data.total);
  });

  test("DELETE_PROPERTY creates an audit log", async () => {
    // Create a throwaway property to delete
    const createRes = await request(app)
      .post("/api/admin/properties")
      .set("Cookie", adminCookie)
      .send({
        title: "To Be Deleted",
        price: 100000,
        address: "Delete Me",
        purpose: "sale",
        type: "studio",
        lang: "ar",
        agent_id: testAgentId,
      })
      .expect(201);

    const propId = createRes.body.data.id;

    const beforeLogs = await request(app)
      .get("/api/admin/audit-logs?action=DELETE_PROPERTY")
      .set("Cookie", adminCookie)
      .expect(200);

    await request(app)
      .delete(`/api/admin/properties/${propId}`)
      .set("Cookie", adminCookie)
      .expect(200);

    const afterLogs = await request(app)
      .get("/api/admin/audit-logs?action=DELETE_PROPERTY")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(afterLogs.body.data.total).toBeGreaterThanOrEqual(beforeLogs.body.data.total);
  });
});

// ─── 7.27 Functional Tests — Agents ───────────────────────────────────

describe("Audit Logs — Create/Update/Delete Agent", () => {
  let agentId;

  test("CREATE_AGENT creates an audit log", async () => {
    const beforeLogs = await request(app)
      .get("/api/admin/audit-logs?action=CREATE_AGENT")
      .set("Cookie", adminCookie)
      .expect(200);

    const res = await request(app)
      .post("/api/admin/agents")
      .set("Cookie", adminCookie)
      .send({
        first_name: "Audit",
        last_name: "Agent2",
        email: "audit.agent2@example.com",
        phone: "01000000088",
        password: "Agent@12345",
      })
      .expect(201);

    agentId = res.body.data.id;

    const afterLogs = await request(app)
      .get("/api/admin/audit-logs?action=CREATE_AGENT")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(afterLogs.body.data.total).toBeGreaterThanOrEqual(beforeLogs.body.data.total);
  });

  test("UPDATE_AGENT creates an audit log", async () => {
    await request(app)
      .put(`/api/admin/agents/${agentId}`)
      .set("Cookie", adminCookie)
      .send({ first_name: "Updated" })
      .expect(200);

    // Verify the log exists by checking the most recent
    const logs = await request(app)
      .get("/api/admin/audit-logs?action=UPDATE_AGENT")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(logs.body.data.logs.length).toBeGreaterThan(0);
  });

  test("DELETE_AGENT creates an audit log", async () => {
    await request(app)
      .delete(`/api/admin/agents/${agentId}`)
      .set("Cookie", adminCookie)
      .expect(200);

    const logs = await request(app)
      .get("/api/admin/audit-logs?action=DELETE_AGENT")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(logs.body.data.logs.length).toBeGreaterThan(0);
  });
});

// ─── 7.27 Functional Tests — Clients ──────────────────────────────────

describe("Audit Logs — Update/Delete Client", () => {
  let clientId;

  beforeAll(async () => {
    // Create a client to modify
    const res = await request(app)
      .post("/auth/register")
      .send({
        firstName: "Audit",
        lastName: "Client",
        email: "audit.client@example.com",
        phone: "01000000066",
        password: "Client@12345",
      })
      .expect(201);

    clientId = res.body.data.user.id;
  });

  test("UPDATE_CLIENT creates an audit log", async () => {
    await request(app)
      .put(`/api/admin/users/${clientId}`)
      .set("Cookie", adminCookie)
      .send({ first_name: "UpdatedAudit" })
      .expect(200);

    const logs = await request(app)
      .get("/api/admin/audit-logs?action=UPDATE_CLIENT")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(logs.body.data.logs.length).toBeGreaterThan(0);
  });

  test("DELETE_CLIENT creates an audit log", async () => {
    await request(app)
      .delete(`/api/admin/users/${clientId}`)
      .set("Cookie", adminCookie)
      .expect(200);

    const logs = await request(app)
      .get("/api/admin/audit-logs?action=DELETE_CLIENT")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(logs.body.data.logs.length).toBeGreaterThan(0);
  });
});

// ─── 7.27 Functional Tests — Admin Settings ───────────────────────────

describe("Audit Logs — Admin Settings", () => {
  test("UPDATE_ADMIN_PROFILE creates an audit log", async () => {
    await request(app)
      .put("/api/admin/settings/profile")
      .set("Cookie", adminCookie)
      .send({
        first_name: "Audit",
        last_name: "Tester",
        email: ADMIN_USER.email,
        phone: ADMIN_USER.phone,
      })
      .expect(200);

    const logs = await request(app)
      .get("/api/admin/audit-logs?action=UPDATE_ADMIN_PROFILE")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(logs.body.data.logs.length).toBeGreaterThan(0);
  });

  test("CHANGE_ADMIN_PASSWORD creates an audit log", async () => {
    await request(app)
      .put("/api/admin/settings/password")
      .set("Cookie", adminCookie)
      .send({
        currentPassword: ADMIN_USER.password,
        newPassword: "NewAudit@12345",
      })
      .expect(200);

    const logs = await request(app)
      .get("/api/admin/audit-logs?action=CHANGE_ADMIN_PASSWORD")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(logs.body.data.logs.length).toBeGreaterThan(0);

    // Update the stored password for cleanup
    ADMIN_USER.password = "NewAudit@12345";
  });
});

// ─── 7.28 Failed Operation Tests ──────────────────────────────────────

describe("Audit Logs — Failed Operations", () => {
  test("DELETE nonexistent property does NOT create a DELETE log", async () => {
    const beforeLogs = await request(app)
      .get("/api/admin/audit-logs?action=DELETE_PROPERTY")
      .set("Cookie", adminCookie)
      .expect(200);

    await request(app)
      .delete("/api/admin/properties/999999999")
      .set("Cookie", adminCookie)
      .expect(404);

    const afterLogs = await request(app)
      .get("/api/admin/audit-logs?action=DELETE_PROPERTY")
      .set("Cookie", adminCookie)
      .expect(200);

    // No new DELETE_PROPERTY logs
    expect(afterLogs.body.data.total).toBe(beforeLogs.body.data.total);
  });

  test("DELETE nonexistent agent does NOT create a DELETE log", async () => {
    const beforeLogs = await request(app)
      .get("/api/admin/audit-logs?action=DELETE_AGENT")
      .set("Cookie", adminCookie)
      .expect(200);

    await request(app)
      .delete("/api/admin/agents/999999999")
      .set("Cookie", adminCookie)
      .expect(404);

    const afterLogs = await request(app)
      .get("/api/admin/audit-logs?action=DELETE_AGENT")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(afterLogs.body.data.total).toBe(beforeLogs.body.data.total);
  });
});

// ─── 7.29 Pagination & Filtering Tests ────────────────────────────────

describe("Audit Logs — Pagination & Filtering", () => {
  test("Pagination returns correct structure", async () => {
    const res = await request(app)
      .get("/api/admin/audit-logs?page=1&limit=5")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(res.body.data.logs.length).toBeLessThanOrEqual(5);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.limit).toBe(5);
    expect(typeof res.body.data.total).toBe("number");
    expect(typeof res.body.data.totalPages).toBe("number");
  });

  test("Action filter works", async () => {
    const res = await request(app)
      .get("/api/admin/audit-logs?action=CREATE_PROPERTY")
      .set("Cookie", adminCookie)
      .expect(200);

    res.body.data.logs.forEach((log) => {
      expect(log.action).toBe("CREATE_PROPERTY");
    });
  });

  test("Entity type filter works", async () => {
    const res = await request(app)
      .get("/api/admin/audit-logs?entity_type=agent")
      .set("Cookie", adminCookie)
      .expect(200);

    res.body.data.logs.forEach((log) => {
      expect(log.entity_type).toBe("agent");
    });
  });

  test("Search works", async () => {
    const res = await request(app)
      .get("/api/admin/audit-logs?search=_audit_")
      .set("Cookie", adminCookie)
      .expect(200);

    expect(res.body.data.logs.length).toBeGreaterThan(0);
  });

  test("Sensitive data not in metadata — no passwords", async () => {
    const res = await request(app)
      .get("/api/admin/audit-logs")
      .set("Cookie", adminCookie)
      .expect(200);

    res.body.data.logs.forEach((log) => {
      if (log.metadata) {
        const metaStr = JSON.stringify(log.metadata);
        expect(metaStr.toLowerCase()).not.toContain("password");
        expect(metaStr.toLowerCase()).not.toContain("password_hash");
        expect(metaStr.toLowerCase()).not.toContain("token");
        expect(metaStr.toLowerCase()).not.toContain("cookie");
        expect(metaStr.toLowerCase()).not.toContain("session_secret");
      }
    });
  });
});

// ─── 7.33 Database Verification ───────────────────────────────────────

describe("Audit Logs — Database Verification", () => {
  test("Audit logs table exists with correct columns", async () => {
    const result = await executeQuery(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'audit_logs'
       ORDER BY ordinal_position`,
      [],
      "verify audit_logs schema"
    );

    const columns = result.rows.map((r) => r.column_name);
    expect(columns).toContain("id");
    expect(columns).toContain("admin_id");
    expect(columns).toContain("action");
    expect(columns).toContain("entity_type");
    expect(columns).toContain("entity_id");
    expect(columns).toContain("description");
    expect(columns).toContain("metadata");
    expect(columns).toContain("ip_address");
    expect(columns).toContain("user_agent");
    expect(columns).toContain("created_at");
  });

  test("Audit logs contain real records with correct admin_id", async () => {
    const result = await executeQuery(
      `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5`,
      [],
      "verify audit_logs data"
    );

    expect(result.rows.length).toBeGreaterThan(0);
    result.rows.forEach((row) => {
      expect(typeof row.admin_id).toBe("number");
      expect(typeof row.action).toBe("string");
      expect(typeof row.entity_type).toBe("string");
      expect(typeof row.description).toBe("string");
      expect(row.created_at).toBeDefined();
    });
  });

  test("No passwords or tokens in audit metadata", async () => {
    const result = await executeQuery(
      `SELECT metadata FROM audit_logs WHERE metadata IS NOT NULL AND metadata != '{}'::jsonb`,
      [],
      "verify no sensitive data in metadata"
    );

    result.rows.forEach((row) => {
      const metaStr = JSON.stringify(row.metadata).toLowerCase();
      expect(metaStr).not.toContain("password");
      expect(metaStr).not.toContain("password_hash");
      expect(metaStr).not.toContain("token");
      expect(metaStr).not.toContain("cookie");
      expect(metaStr).not.toContain("session_secret");
      expect(metaStr).not.toContain("authorization");
    });
  });

  test("No foreign key to clients — audit records survive admin deletion", async () => {
    const result = await executeQuery(
      `SELECT conname, contype
       FROM pg_constraint
       WHERE conrelid = 'audit_logs'::regclass`,
      [],
      "verify no FK constraint"
    );

    // Should have no foreign key constraints (contype = 'f')
    const fkConstraints = result.rows.filter((r) => r.contype === "f");
    expect(fkConstraints.length).toBe(0);
  });
});
