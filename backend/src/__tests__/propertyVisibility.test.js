import request from "supertest";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { describe, expect, test, afterAll } from "vitest";
import router from "../routes/index.js";
import pool from "../db/pool.js";
import { errorHandler } from "../middlewares/errorHandler.js";
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
app.use("/api", router);
app.use(errorHandler);

const SEED_ARABIC_COUNT = 10;
const SEED_ENGLISH_COUNT = 10;

describe("Public API property counts", () => {
  test("GET /api/ar/listings returns all 10 seeded Arabic properties", async () => {
    const res = await request(app).get("/api/ar/listings").expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(SEED_ARABIC_COUNT);
  });

  test("GET /api/en/listings returns all 10 seeded English properties", async () => {
    const res = await request(app).get("/api/en/listings").expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(SEED_ENGLISH_COUNT);
  });

  test("Arabic and English IDs are disjoint sets", async () => {
    const arRes = await request(app).get("/api/ar/listings").expect(200);
    const enRes = await request(app).get("/api/en/listings").expect(200);
    const arIds = arRes.body.data.map((p) => p.id);
    const enIds = enRes.body.data.map((p) => p.id);
    const overlap = arIds.filter((id) => enIds.includes(id));
    expect(overlap).toEqual([]);
  });
});

describe("Public API currency & price_period columns", () => {
  test("every Arabic listing includes currency and price_period", async () => {
    const res = await request(app).get("/api/ar/listings").expect(200);
    for (const listing of res.body.data) {
      expect(listing.currency).toBe("EGP");
      expect(["sale", "monthly", "yearly"]).toContain(listing.price_period);
    }
  });

  test("every English listing includes currency and price_period", async () => {
    const res = await request(app).get("/api/en/listings").expect(200);
    for (const listing of res.body.data) {
      expect(listing.currency).toBe("EGP");
      expect(["sale", "monthly", "yearly"]).toContain(listing.price_period);
    }
  });
});

describe("Public API purpose distribution per language", () => {
  test("Arabic has exactly 5 sale and 5 rent properties", async () => {
    const res = await request(app).get("/api/ar/listings").expect(200);
    const saleCount = res.body.data.filter((p) => p.purpose === "sale").length;
    const rentCount = res.body.data.filter((p) => p.purpose === "rent").length;
    expect(saleCount).toBe(5);
    expect(rentCount).toBe(5);
  });

  test("English has exactly 5 sale and 5 rent properties", async () => {
    const res = await request(app).get("/api/en/listings").expect(200);
    const saleCount = res.body.data.filter((p) => p.purpose === "sale").length;
    const rentCount = res.body.data.filter((p) => p.purpose === "rent").length;
    expect(saleCount).toBe(5);
    expect(rentCount).toBe(5);
  });
});

describe("Public API status exposure", () => {
  test("Arabic properties include all status types (available, sold, rented, pending)", async () => {
    const res = await request(app).get("/api/ar/listings").expect(200);
    const statuses = new Set(res.body.data.map((p) => p.status));
    expect(statuses.has("available")).toBe(true);
    expect(statuses.has("sold")).toBe(true);
    expect(statuses.has("rented")).toBe(true);
    expect(statuses.has("pending")).toBe(true);
  });
});

describe("Public API inactive agent properties", () => {
  test("property with inactive agent (arabic id 4) is still returned", async () => {
    const res = await request(app).get("/api/ar/listings").expect(200);
    const prop4 = res.body.data.find((p) => p.id === 4);
    expect(prop4).toBeDefined();
    expect(prop4.purpose).toBe("rent");
    expect(prop4.agent).toBeDefined();
    expect(prop4.agent).not.toBeNull();
  });
});

describe("Public API featured properties", () => {
  test("exactly 5 Arabic properties are marked is_featured", async () => {
    const res = await request(app).get("/api/ar/listings").expect(200);
    const featured = res.body.data.filter((p) => p.is_featured);
    expect(featured.length).toBe(5);
  });
});

describe("Public API language validation", () => {
  test("unsupported language returns 406", async () => {
    await request(app).get("/api/gr/listings").expect(406);
  });
});

describe("Single listing includes currency & price_period", () => {
  test("GET /api/ar/listings/1 returns currency and price_period", async () => {
    const res = await request(app).get("/api/ar/listings/1").expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currency).toBe("EGP");
    expect(["sale", "monthly", "yearly"]).toContain(res.body.data.price_period);
  });
});

describe("Similar listings endpoint", () => {
  test("GET /api/ar/listings/1/similar returns similar properties with valid purpose", async () => {
    const res = await request(app).get("/api/ar/listings/1/similar").expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(3);
    for (const listing of res.body.data) {
      expect(listing.currency).toBe("EGP");
      expect(listing.id).not.toBe(1);
    }
  });

  test("similar listings without purpose returns results", async () => {
    const res = await request(app).get("/api/ar/listings/1/similar").expect(200);
    expect(res.body.success).toBe(true);
  });

  test("similar listings for non-existent property still returns similar items (no source validation)", async () => {
    const res = await request(app).get("/api/ar/listings/99999/similar").expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

afterAll(async () => {
  await pool.end();
});
