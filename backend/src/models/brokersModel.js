import { executeQuery } from "../utils/dbHelpers.js";

/*
 * Brokers = agents. Only active agents are exposed publicly so that
 * inactive agents never appear as public/active listings.
 */
async function findAll() {
  const result = await executeQuery(
    `SELECT id, first_name, last_name, phone, email, bio, profile_image_url, is_active
       FROM agents
      WHERE is_active = TRUE
      ORDER BY id ASC`,
    [],
    "Getting all brokers"
  );
  return result.rows;
}

async function findById(id) {
  const result = await executeQuery(
    `SELECT id, first_name, last_name, phone, email, bio, profile_image_url, is_active
       FROM agents
      WHERE id = $1 AND is_active = TRUE`,
    [id],
    "Getting broker by id"
  );
  return result.rows[0];
}

export default { findAll, findById };
