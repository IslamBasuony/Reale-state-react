#!/usr/bin/env node

// Promote an existing client to admin.
// Usage:  node src/scripts/promoteAdmin.js <email>
//   or:   npm run promote-admin -- <email>

import pool from "../db/pool.js";

const email = process.argv[2];

if (!email) {
  console.error("Usage: node src/scripts/promoteAdmin.js <email>");
  process.exit(1);
}

async function promote() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE clients
          SET is_admin = TRUE
        WHERE email = $1
        RETURNING id, first_name, last_name, email, is_admin`,
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      console.error(`No client found with email: ${email}`);
      process.exit(1);
    }

    const user = result.rows[0];
    console.log(
      `Done — ${user.first_name} ${user.last_name} (${user.email}) is now an admin.`
    );
  } catch (error) {
    console.error("Failed to promote user:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

promote();
