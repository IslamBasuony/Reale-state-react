// Production-safe non-destructive provisioning for the real estate platform.
//
// Unlike `npm run seed` (which DROPs and recreates every object via schema.sql),
// this script NEVER deletes data already present in the target database.
//
// Behavior:
//   1. If the database is EMPTY (no `clients` table), apply the canonical
//      schema.sql once, then all idempotent migrations, then validate.
//   2. If the schema already exists, only the idempotent migrations are applied.
//   3. Demo data is seeded ONLY when no properties exist for that language yet,
//      so re-running is safe and does not duplicate listings.
//
// Usage:  npm run seed:demo
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

import pool from "./pool.js";
import { createSchema, validateSchema } from "./schema.js";
import { initDB, closeDB, seedData } from "./seed.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPECTED_TABLES = [
  "agents",
  "clients",
  "areas",
  "amenities",
  "properties",
  "property_amenities",
  "property_images",
  "reviews",
  "property_viewings",
  "sessions",
  "newsletter_subscribers",
  "contact_messages",
  "project_inquiries",
  "password_reset_tokens",
  "email_verification_tokens",
  "audit_logs",
];

async function tableExists(db, table) {
  const result = await db.query(
    `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [table]
  );
  return result.rows[0].exists;
}

async function applyMigrations(db) {
  const dir = path.join(__dirname, "migrations");
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = await fs.readFile(path.join(dir, file), "utf8");
    await db.query(sql);
    console.log(`Applied migration: ${file}`);
  }
}

async function verifySchema(db) {
  const missing = [];
  for (const table of EXPECTED_TABLES) {
    if (!(await tableExists(db, table))) {
      missing.push(table);
    }
  }
  if (missing.length) {
    throw new Error(`Missing tables after provisioning: ${missing.join(", ")}`);
  }
  console.log(`Verified all ${EXPECTED_TABLES.length} expected tables exist.`);
}

async function seedIfEmpty(db, langCode) {
  const result = await db.query(
    `SELECT COUNT(*)::int AS count FROM properties WHERE lang = $1`,
    [langCode]
  );
  if (result.rows[0].count > 0) {
    console.log(`Seeding skipped for "${langCode}" — data already present.`);
    return;
  }
  await seedData(langCode === "ar" ? "arabic" : "english");
}

async function main() {
  console.log("Starting NON-DESTRUCTIVE production provisioning...");
  await initDB();

  try {
    const clientsPresent = await tableExists(pool, "clients");

    if (!clientsPresent) {
      console.log("Fresh database detected — applying canonical schema (schema.sql).");
      await createSchema(pool);
      await applyMigrations(pool);
    } else {
      console.log("Schema already present — applying idempotent migrations only.");
      await applyMigrations(pool);
    }

    await validateSchema(pool);
    await verifySchema(pool);

    await seedIfEmpty(pool, "ar");
    await seedIfEmpty(pool, "en");

    const counts = await pool.query(
      `SELECT 'clients' AS t, COUNT(*) FROM clients
       UNION ALL SELECT 'agents', COUNT(*) FROM agents
       UNION ALL SELECT 'properties', COUNT(*) FROM properties
       UNION ALL SELECT 'property_images', COUNT(*) FROM property_images`
    );
    for (const row of counts.rows) {
      console.log(`${row.t}: ${row.count}`);
    }

    console.log("Provisioning completed successfully. No data was deleted.");
  } catch (error) {
    console.error("Provisioning failed:", error.message);
    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}

process.on("SIGINT", async () => {
  await closeDB();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeDB();
  process.exit(0);
});

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main();
}

export default { provisioning: main };