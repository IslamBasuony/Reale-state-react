import { executeQuery } from "../utils/dbHelpers.js";
import crypto from "crypto";
import { hashPassword } from "../utils/password.js";

const TOKEN_EXPIRY_MINUTES = 30;

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const createResetToken = async (userId) => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await executeQuery(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt.toISOString()],
    "create password reset token"
  );

  return rawToken;
};

const verifyToken = async (token) => {
  const tokenHash = hashToken(token);
  const result = await executeQuery(
    `SELECT prt.*, c.id as uid, c.email
     FROM password_reset_tokens prt
     JOIN clients c ON c.id = prt.user_id
     WHERE prt.token_hash = $1
       AND prt.used_at IS NULL
       AND prt.expires_at > NOW()
     ORDER BY prt.created_at DESC
     LIMIT 1`,
    [tokenHash],
    "verify password reset token"
  );
  return result.rows[0] || null;
};

const markTokenUsed = async (tokenId) => {
  await executeQuery(
    `UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [tokenId],
    "mark reset token used"
  );
};

const resetPassword = async (token, newPassword) => {
  const record = await verifyToken(token);
  if (!record) return null;

  const hashedPassword = await hashPassword(newPassword);
  await executeQuery(
    `UPDATE clients SET password = $1 WHERE id = $2`,
    [hashedPassword, record.user_id],
    "reset user password"
  );
  await markTokenUsed(record.id);

  // Invalidate all sessions for this user by destroying them
  // Sessions store user id in sess.passport.user
  await executeQuery(
    `DELETE FROM sessions WHERE sess::json->>'passport' IS NOT NULL
     AND (sess::json->'passport'->>'user')::int = $1`,
    [record.user_id],
    "invalidate user sessions after password reset"
  );

  return { userId: record.user_id, email: record.email };
};

const findUserByEmail = async (email) => {
  const result = await executeQuery(
    `SELECT id, email FROM clients WHERE email = $1`,
    [email.trim().toLowerCase()],
    "find user by email for password reset"
  );
  return result.rows[0] || null;
};

export default {
  createResetToken,
  verifyToken,
  resetPassword,
  findUserByEmail,
};
