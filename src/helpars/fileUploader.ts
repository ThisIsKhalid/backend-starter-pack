
import path from "path";
import multer from "multer";
import { slugify } from "../utils/slugify";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

/**
 * File filter for validating allowed MIME types.
 */
export const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/tiff",
    "image/webp",
    "audio/mpeg",
    "video/mp4",
  ];

  if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

/**
 * Creates a storage configuration with a specific folder.
 */
export const createStorage = (folder?: string) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadFolder = folder
          ? path.join(process.cwd(), "uploads", folder)
          : path.join(process.cwd(), "uploads");

      // ✅ Ensure the folder exists at the moment of file upload
      if (!fs.existsSync(uploadFolder)) {
        fs.mkdirSync(uploadFolder, { recursive: true });
      }

      cb(null, uploadFolder);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${uuidv4()}-${Date.now()}`;
      const fileExtension = path.extname(file.originalname);
      const slugifiedName = slugify(path.basename(file.originalname, fileExtension));

      const fileName = `${slugifiedName}-${uniqueSuffix}${fileExtension}`;
      cb(null, fileName);
    },
  });
};

/**
 * Multer upload configuration.
 */
export const upload = multer({
  storage: createStorage(),
  fileFilter: fileFilter,
});

/**
 * Specific upload configuration for refunds.
 */
const uploadRefunds = multer({ storage: createStorage("refund") });

/**
 * Multer configuration for handling multiple file uploads.
 */
const uploadMultiple = uploadRefunds.fields([
  { name: "galleryImage", maxCount: 5 },
]);

/**
 * Multer configuration for handling snippet file uploads.
 */

