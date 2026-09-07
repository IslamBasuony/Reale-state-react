import { executeQuery } from "../utils/dbHelpers.js";

const create = async ({ projectId, name, email, phone }) => {
  const result = await executeQuery(
    `INSERT INTO project_inquiries (project_id, name, email, phone)
     VALUES ($1, $2, $3, $4)
     RETURNING id, project_id, name, email, created_at`,
    [projectId, name.trim(), email.trim().toLowerCase(), phone.trim()],
    "project inquiry create"
  );
  return result.rows[0];
};

export default { create };
