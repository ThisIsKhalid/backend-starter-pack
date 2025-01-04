import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fs from "fs";
import multer from "multer";
import path from "path";
import config from "../../config";
import { fileFilter } from "../fileFilter";

// Initialize S3 client
export const s3Client = new S3Client({
  region: config.aws.region as string,
  endpoint: "https://nyc3.digitaloceanspaces.com",
  credentials: {
    accessKeyId: config.aws.accessKeyId as string,
    secretAccessKey: config.aws.secretAccessKey as string,
  },
});
/**
 * Multipart Upload Handler (For Very Large Files)
 * @param {string} folder - Folder name in S3
 * @param {string} originalName - Original file name
 * @param {string} mimeType - File MIME type
 * @param {string} filePath - Local file path for the file
 * @returns {Promise<string>} - The public S3 URL of the uploaded file
 */

export const fileUploadToS3 = async (
  title: string,
  folder: string,
  originalName: string,
  mimeType: string,
  filePath: string
): Promise<string> => {
  const bucketName = config.aws.bucketName;
  if (!bucketName) {
    throw new Error("S3 bucket name is not defined in the configuration.");
  }

  const fileName = `${folder}/${title}_${originalName}`;
  const fileStream = fs.createReadStream(filePath);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: fileStream,
    ContentType: mimeType,
    ACL: "public-read",
  });

  try {
    await s3Client.send(command);
    return `https://${bucketName}.nyc3.digitaloceanspaces.com/${fileName}`;
  } catch (error) {
    console.error("S3 Multipart Upload Error:", error);
    throw new Error("Failed to upload large file to S3");
  } finally {
    fs.unlinkSync(filePath); // Remove temporary file
  }
};
/**
 * Multer configuration for in-memory and disk storage options
 */
export const s3Uploader = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, "../../../uploads");
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueSuffix);
    },
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024 * 1024, // 1GB max file size
  },
});
