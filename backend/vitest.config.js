import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node", // <— crucial for Express apps
    globals: true,
    // Force the test environment so `getDbConfig()` always resolves to the
    // dedicated TEST_DB_* database and can never fall back to the dev DB.
    env: { NODE_ENV: "test" },
    fileParallelism: false, // test files TRUNCATE shared tables; run sequentially
    include: ["src/__tests__/**/*.test.js"], // adjust as needed
    deps: {
      interopDefault: true,
      inline: ["supertest"], // fixes ESM edge cases
    },
  },
});
