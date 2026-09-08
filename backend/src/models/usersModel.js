import { executeQuery } from "../utils/dbHelpers.js";

async function findUserById(id) {
  try {
    const queryText = `SELECT id, first_name, last_name, email, phone, created_at, updated_at FROM clients WHERE id =$1;`;
    const result = await executeQuery(
      queryText,
      [id],
      "Getting a user by their id"
    );
    const user = result.rows[0];
    return user;
  } catch (error) {
    console.error("Error in findUserById(): ", error);
    throw error;
  }
}

export default { findUserById };
