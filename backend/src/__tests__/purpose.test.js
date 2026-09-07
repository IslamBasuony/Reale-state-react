import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import request from "supertest";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { afterAll, describe, expect, it } from "vitest";
import router from "../routes/index.js";
import pool from "../db/pool.js";
import { executeQuery } from "../utils/dbHelpers.js";
import { errorHandler } from "../middlewares/errorHandler.js";
import "../middlewares/passport.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const readSeedFile = async (dir) => {
  const file = path.join(__dirname, "..", "db", dir, "properties.json");
  return JSON.parse(await fs.readFile(file, "utf8"));
};

describe("P10 purpose — seed data integrity", () => {
  it("every seed property has an explicit sale/rent purpose", async () => {
    const arabic = await readSeedFile("ArabicSeeds");
    const english = await readSeedFile("EnglishSeeds");
    for (const property of [...arabic, ...english]) {
      expect(["sale", "rent"]).toContain(property.purpose);
    }
  });

  it("Arabic and English seed properties match purpose by index", async () => {
    const arabic = await readSeedFile("ArabicSeeds");
    const english = await readSeedFile("EnglishSeeds");
    expect(arabic).toHaveLength(10);
    expect(english).toHaveLength(10);
    arabic.forEach((property, index) => {
      expect(property.purpose).toBe(english[index].purpose);
    });
  });
});

describe("P10 purpose — database", () => {
  it("properties.purpose is NOT NULL and only sale/rent (10 each)", async () => {
    const result = await executeQuery(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE purpose IS NULL)::int AS nulls,
              count(*) FILTER (WHERE purpose NOT IN ('sale', 'rent'))::int AS invalid,
              count(*) FILTER (WHERE purpose = 'sale')::int AS sales,
              count(*) FILTER (WHERE purpose = 'rent')::int AS rents
         FROM properties`,
      [],
      "Checking purpose distribution"
    );
    const row = result.rows[0];
    expect(row.total).toBe(20);
    expect(row.nulls).toBe(0);
    expect(row.invalid).toBe(0);
    expect(row.sales).toBe(10);
    expect(row.rents).toBe(10);
  });

  it("no orphan property relations (images/amenities/reviews/viewings resolve)", async () => {
    const orphanCheck = await executeQuery(
      `SELECT
         (SELECT count(*) FROM property_images pi WHERE NOT EXISTS (SELECT 1 FROM properties p WHERE p.id = pi.property_id))::int AS images,
         (SELECT count(*) FROM property_amenities pa WHERE NOT EXISTS (SELECT 1 FROM properties p WHERE p.id = pa.property_id))::int AS amenities,
         (SELECT count(*) FROM reviews r WHERE r.property_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM properties p WHERE p.id = r.property_id))::int AS reviews,
         (SELECT count(*) FROM property_viewings pv WHERE NOT EXISTS (SELECT 1 FROM properties p WHERE p.id = pv.property_id))::int AS viewings`,
      [],
      "Checking orphan relations"
    );
    expect(orphanCheck.rows[0]).toEqual({
      images: 0,
      amenities: 0,
      reviews: 0,
      viewings: 0,
    });
  });
});

describe("P10 purpose — API exposure", () => {
  it("GET /api/ar/listings returns a valid purpose for every property", async () => {
    const res = await request(app).get("/api/ar/listings").expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const listing of res.body.data) {
      expect(["sale", "rent"]).toContain(listing.purpose);
    }
  });

  it("GET /api/en/listings returns a valid purpose for every property", async () => {
    const res = await request(app).get("/api/en/listings").expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const listing of res.body.data) {
      expect(["sale", "rent"]).toContain(listing.purpose);
    }
  });
});

afterAll(async () => {
  await pool.end();
});
