import fs from "fs";
import multer from "multer";
import path from "path";

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimeTypes = [
    "video/mp4", // MP4
    "video/quicktime", // MOV
    "video/x-msvideo", // AVI
    "video/webm", // WebM
    "video/x-ms-wmv", // WMV
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Only ${allowedMimeTypes.join(", ")} are allowed`
      ),
      false
    );
  }
};

/**
 * Multer configuration for in-memory and disk storage options
 */
export const videoUploader = multer({
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
    fileSize: 1 * 1024 * 1024 * 1024, // 1GB max file size
  },
});
