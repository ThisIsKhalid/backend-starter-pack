import fs from "fs";
import multer from "multer";
import path from "path";
import { fileFilter } from "./fileFilter";

// const uploadDir = path.join(process.cwd(), "uploads");

// // Ensure the directory exists
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // cb(null, path.join( "/var/www/uploads"));
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File filter for validation

export const upload = multer({ storage: storage, fileFilter: fileFilter });

const uploadSingle = upload.single("carImage");

const uploadMultiple = upload.fields([
  { name: "singleImage", maxCount: 10 },
  { name: "galleryImage", maxCount: 10 },
]);
