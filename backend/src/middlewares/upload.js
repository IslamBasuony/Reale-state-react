import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, "../../uploads/properties");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 10;
const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// Ensure upload directory exists at module load
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    // Use only the extension from originalname; reject double extensions
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error("امتداد الملف غير مدعوم"), false);
    }
    const name = crypto.randomBytes(16).toString("hex") + ext;
    cb(null, name);
  },
});

const fileFilter = (_req, file, cb) => {
  // Validate MIME type
  if (!ALLOWED_MIMES.has(file.mimetype)) {
    return cb(new Error("صيغة الملف غير مدعومة — يُسمح فقط بـ JPEG، PNG، WEBP"), false);
  }
  // Validate extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error("امتداد الملف غير مدعوم"), false);
  }
  cb(null, true);
};

export const uploadPropertyImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
}).array("images", MAX_FILES);

/**
 * Validate that a stored image_url is safe — no path traversal.
 * Returns true if the path is within /uploads/properties/.
 */
export const isValidImagePath = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string") return false;
  // Must start with /uploads/properties/
  if (!imageUrl.startsWith("/uploads/properties/")) return false;
  // Must not contain path traversal
  if (imageUrl.includes("..")) return false;
  // Normalize and check it stays within bounds
  const normalized = path.posix.normalize(imageUrl);
  return normalized.startsWith("/uploads/properties/");
};

export { UPLOAD_DIR, MAX_FILE_SIZE, MAX_FILES };
