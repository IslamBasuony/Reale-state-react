import { executeQuery } from "../utils/dbHelpers.js";

const create = async ({ name, email, phone, message }) => {
  const result = await executeQuery(
    `INSERT INTO contact_messages (name, email, phone, message)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, phone, created_at`,
    [name.trim(), email.trim().toLowerCase(), phone.trim(), message.trim()],
    "contact message create"
  );
  return result.rows[0];
};

export default { create };
