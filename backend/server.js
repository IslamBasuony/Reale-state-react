import app from "./app.js";

import pool from "./src/db/pool.js";

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down ...");
  await pool.end();
  server.close(() => process.exit(0));
});
