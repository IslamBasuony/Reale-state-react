import { executeQuery } from "../utils/dbHelpers.js";

const subscribe = async (email) => {
  const normalized = email.trim().toLowerCase();
  const result = await executeQuery(
    `INSERT INTO newsletter_subscribers (email)
     VALUES ($1)
     ON CONFLICT (email) DO UPDATE SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP
     RETURNING id, email, created_at`,
    [normalized],
    "newsletter subscribe"
  );
  return result.rows[0];
};

export default { subscribe };
