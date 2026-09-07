import { AppError } from "../utils/customErrors.js";
import { executeQuery } from "../utils/dbHelpers.js";

// Effects: fetches and returns users if lang is Arabic;
//////////: TEMPORARILY throws Error when language is English

async function findAllUseres(lang) {
  try {
    let queryText;
    if (lang === "ar") {
      queryText = `
        SELECT id, first_name, last_name , email, phone
        FROM clients;
      `;
      const result = await executeQuery(queryText, [], "Getting all users");
      if (!result) {
        throw new AppError("Problems while getting all users");
      }

      return result.rows;
    } else {
      throw new AppError("English isn't supported yet", 404);
    }
  } catch (err) {
    console.error("Error in findAllUseres():", err);
    throw err;
  }
}

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

export default { findAllUseres, findUserById };
