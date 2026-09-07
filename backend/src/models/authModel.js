import bcrypt from "bcrypt";
import { AppError } from "../utils/customErrors.js";

import { executeQuery } from "../utils/dbHelpers.js";

async function registerModel({ firstName, lastName, phone, email, password }) {
  try {
    // Check if user already exists
    const existingUser = await executeQuery(
      `SELECT id FROM clients WHERE email = $1`,
      [email],
      "Checking if user exists"
    );

    if (existingUser && existingUser.rows && existingUser.rows.length > 0) {
      throw new AppError("User with this email already exists", 409);
    }

    // Hash password

    const hashedPassword = await hashPassword(password);

    // Insert new user
    const queryText = `
      INSERT INTO clients (first_name, last_name, phone, email, password) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, first_name, last_name, email, phone, is_admin
    `;

    const result = await executeQuery(
      queryText,
      [firstName, lastName, phone, email, hashedPassword],
      "Inserting new user to the database"
    );

    return result.rows[0];
  } catch (error) {
    // If it's already an AppError, just re-throw it
    if (error instanceof AppError) {
      throw error;
    }

    // Otherwise, wrap it in AppError
    throw new AppError("Failed to register user", 500, {
      originalError: error,
    });
  }
}

async function hashPassword(password) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
}
export default { registerModel };
