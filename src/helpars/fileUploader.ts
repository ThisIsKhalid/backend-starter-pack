import fs from "fs";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { slugify } from "../utils/slugify";
import { fileFilter } from "./fileFilter";

const uploadDir = path.join(process.cwd(), "uploads");

// Ensure the directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// local file storage
export const createStorage = (folder?: string) => {
  const uploadFolder = folder
    ? path.join(process.cwd(), "uploads", folder)
    : path.join(process.cwd(), "uploads");

  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadFolder);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = `${uuidv4()}-${Date.now()}`;
      const fileExtension = path.extname(file.originalname);

      const slugifiedName = slugify(
        path.basename(file.originalname, fileExtension)
      );

      const fileName = `${slugifiedName}-${uniqueSuffix}${fileExtension}`;

      cb(null, fileName);
    },
  });
};

export const upload = multer({
  storage: createStorage(),
  fileFilter: fileFilter,
});

// const example = upload.fields([{ name: "galleryImage", maxCount: 5 }]);

// const anotherExample = upload.single("avatar");

// const uploadRefunds = multer({ storage: createStorage("refund") });

// const uploadMultiple = uploadRefunds.fields([
//   { name: "galleryImage", maxCount: 5 },
// ]);
