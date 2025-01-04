import fs from "fs";
import multer from "multer";
import path from "path";

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
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimeTypes = [
    "video/mp4",
    "video/mov",
    "video/avi",
    "image/jpeg",
    "image/png",
    "image/jpg",
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

export const upload = multer({ storage: storage, fileFilter: fileFilter });

const uploadSingle = upload.single("carImage");

const uploadMultiple = upload.fields([
  { name: "singleImage", maxCount: 10 },
  { name: "galleryImage", maxCount: 10 },
]);

