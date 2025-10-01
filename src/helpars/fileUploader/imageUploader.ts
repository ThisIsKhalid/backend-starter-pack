import { Request } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/tiff",
    "image/webp",
    "image/svg+xml", // Add if you need SVG support
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported file format. Please upload: JPEG, PNG, GIF, BMP, TIFF, WebP, or SVG images only."
      ) as any,
      false
    );
  }
};

/**
 * Multer configuration for in-memory and disk storage options
 */
export const imageUploader = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, "../../../uploads");
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const fileExtension = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, fileExtension);
      const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, "_");
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${sanitizedName}-${uniqueSuffix}${fileExtension}`);
    },
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size (more reasonable for images)
  },
});
