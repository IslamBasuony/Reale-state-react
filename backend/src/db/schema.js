// Setup database configurations and validate the structure of the schema

import dotenv from "dotenv";
dotenv.config();
import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
  development: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "real_estate_db",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
    ssl: false,
    pool: {
      min: 2,
      max: 10,
    },
  },
  production: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false,
    },
    pool: {
      min: 5,
      max: 20,
    },
  },
  test: {
    host: process.env.TEST_DB_HOST,
    port: process.env.TEST_DB_PORT,
    database: process.env.TEST_DB_NAME,
    user: process.env.TEST_DB_USER,
    password: process.env.TEST_DB_PASSWORD,
    ssl: false,
    pool: {
      min: 1,
      max: 5,
    },
  },
};

/**
 * get database configuratons for current environment
 * @returns {object} dbConfig[env]
 */
function getDbConfig() {
  const env = process.env.NODE_ENV || "development";
  console.log("Connecting to DB with user:", process.env.DB_USER);
  if (env === "test") {
    const requiredVars = [
      ["TEST_DB_HOST", process.env.TEST_DB_HOST],
      ["TEST_DB_PORT", process.env.TEST_DB_PORT],
      ["TEST_DB_NAME", process.env.TEST_DB_NAME],
      ["TEST_DB_USER", process.env.TEST_DB_USER],
      ["TEST_DB_PASSWORD", process.env.TEST_DB_PASSWORD],
    ];
    const missing = requiredVars
      .filter(([, value]) => value === undefined || value === "")
      .map(([name]) => name);
    if (missing.length) {
      throw new Error(
        `Missing test database configuration: ${missing.join(", ")}. ` +
          "Set TEST_DB_* environment variables to a dedicated test database " +
          "(never the development/demo database) before running the test suite."
      );
    }
  }
  return dbConfig[env];
}

/** Read and execute SQL schema file
 * @param {object} db - Database connection object
 */
async function createSchema(db) {
  try {
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = await fs.readFile(schemaPath, "utf-8");

    await db.query(schema);

    console.log("Creating database schema ...");

    console.log("Schema created successfully");
  } catch (error) {
    console.error("error creating schema: ", error.message);
    throw error;
  }
}

/**
 * Validate that all required tables exist
 * @param {object} db - Database connection object
 */
async function validateSchema(db) {
  const requiredTables = [
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
  ];
  try {
    console.log("Validating schema...");
    for (const tableName of requiredTables) {
      const result = await db.query(
        `
                SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1);`,
        [tableName]
      );
      if (!result.rows[0].exists) {
        throw new Error(`Required table '${tableName}' does not exist`);
      }
    }
    console.log("Schema validation passed");
  } catch (error) {
    console.error("Schema validation failed:", error.message);
    throw error;
  }
}

export { getDbConfig, createSchema, validateSchema };
