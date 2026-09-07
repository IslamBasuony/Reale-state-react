import pool from "../db/pool.js";

/**
 * Executes a database query with unified error handling.
 * @param {string} queryText - SQL query string
 * @param {Array} params - Query parameters
 * @param {string} context - Optional context for error logging
 * @returns {Promise<Array>} - Result rows
 */

/**
 * This is what calling pool.query(query) returns
 * {
  command: 'SELECT',       // Type of SQL command executed
  rowCount: 3,             // Number of rows returned (for SELECT) or affected (for INSERT/UPDATE/DELETE)
  oid: null,               // Used internally (mainly with INSERT on legacy tables)
  rows: [                  // Array of result rows (each one is a plain JS object)
    { id: 1, first_name: 'Sara', last_name: 'Ali', email: 'sara@example.com', phone: '0111111111' },
    { id: 2, first_name: 'Ahmed', last_name: 'Tarek', email: 'ahmed@example.com', phone: '0102222222' },
    { id: 3, first_name: 'Layla', last_name: 'Omar', email: 'layla@example.com', phone: '0123333333' }
  ],
  fields: [                // Array of column metadata
    { name: 'id', dataTypeID: 23, tableID: 16384, ... },
    { name: 'first_name', dataTypeID: 1043, ... },
    { name: 'last_name', dataTypeID: 1043, ... },
    { name: 'email', dataTypeID: 1043, ... },
    { name: 'phone', dataTypeID: 1043, ... }
  ]
}
 */
export async function executeQuery(queryText, params = [], context = "") {
  try {
    const result = await pool.query(queryText, params);
    return result;
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      console.error(`Database error while ${context || "unknown context"}:`, error.code || error.message);
    } else {
      console.error(`Database error while ${context || "unknown context"}:`, error);
    }
    throw error; // Let controller or errorHandler handle it
  }
}
