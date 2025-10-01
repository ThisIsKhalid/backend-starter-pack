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
    // XLSX formats
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    // CSV formats
    "text/csv",
    "application/csv",
    "text/plain", // Some systems send CSV as text/plain
    // XLS (older Excel format)
    "application/vnd.ms-excel",
  ];

  const allowedExtensions = [".xlsx", ".xls", ".csv"];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (
    allowedMimeTypes.includes(file.mimetype) &&
    allowedExtensions.includes(fileExtension)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported file format. Please upload: XLSX, XLS, or CSV files only."
      ) as any,
      false
    );
  }
};

/**
 * Multer configuration for in-memory and disk storage options
 */
export const docsUploader = multer({
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
    fileSize: 10 * 1024 * 1024, // 10MB max file size (reasonable for spreadsheets)
  },
});
