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

describe("P11.3 seed data integrity", () => {
  it("Arabic and English seed properties match type by index", async () => {
    const arabic = await readSeedFile("ArabicSeeds");
    const english = await readSeedFile("EnglishSeeds");
    expect(arabic).toHaveLength(10);
    expect(english).toHaveLength(10);
    arabic.forEach((property, index) => {
      expect(property.type).toBe(english[index].type);
    });
  });

  it("every seed property carries an explicit EGP currency", async () => {
    const arabic = await readSeedFile("ArabicSeeds");
    const english = await readSeedFile("EnglishSeeds");
    for (const property of [...arabic, ...english]) {
      expect(["EGP", "USD"]).toContain(property.currency);
      expect(property.currency).toBe("EGP");
    }
  });

  it("price_period matches purpose in every seed property", async () => {
    const arabic = await readSeedFile("ArabicSeeds");
    const english = await readSeedFile("EnglishSeeds");
    for (const property of [...arabic, ...english]) {
      if (property.purpose === "sale") {
        expect(property.price_period).toBe("sale");
      }
      if (property.purpose === "rent") {
        expect(property.price_period).toBe("monthly");
      }
    }
  });
});

describe("P11.3 currency & price_period — database", () => {
  it("currency and price_period are always set and internally consistent", async () => {
    const result = await executeQuery(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE currency IS NULL)::int AS null_currency,
              count(*) FILTER (WHERE price_period IS NULL)::int AS null_period,
              count(*) FILTER (WHERE currency <> 'EGP')::int AS non_egp,
              count(*) FILTER (WHERE purpose = 'sale' AND price_period <> 'sale')::int AS sale_bad,
              count(*) FILTER (WHERE purpose = 'rent' AND price_period <> 'monthly')::int AS rent_bad
         FROM properties`,
      [],
      "Checking currency/price_period distribution"
    );
    expect(result.rows[0]).toEqual({
      total: 20,
      null_currency: 0,
      null_period: 0,
      non_egp: 0,
      sale_bad: 0,
      rent_bad: 0,
    });
  });
});

describe("P11.3 API property exposure", () => {
  it("GET /api/ar/listings returns all 10 seeded properties", async () => {
    const res = await request(app).get("/api/ar/listings").expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(10);
  });

  it("GET /api/en/listings returns all 10 seeded properties", async () => {
    const res = await request(app).get("/api/en/listings").expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(10);
  });

  it("every listing exposes price and status fields", async () => {
    const res = await request(app).get("/api/ar/listings").expect(200);
    for (const listing of res.body.data) {
      expect(listing.price).toBeDefined();
      expect(listing.status).toBeDefined();
      expect(listing.purpose).toBeDefined();
    }
  });
});

afterAll(async () => {
  await pool.end();
});
