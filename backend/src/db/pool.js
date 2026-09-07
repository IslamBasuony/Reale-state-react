import { getDbConfig } from "./schema.js";
import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";
const pool = new Pool(getDbConfig());

// Test connection on startup
pool.on("connect", () => {
  console.log("Database connected successfully");
});

pool.on("error", (err) => {
  console.error("Unexpected database error:", err);
});

export default pool;
