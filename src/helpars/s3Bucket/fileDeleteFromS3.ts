import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import config from "../../config";

// Initialize S3 client
const s3Client = new S3Client({
  region: config.aws.region as string,
  endpoint: "https://nyc3.digitaloceanspaces.com",
  credentials: {
    accessKeyId: config.aws.accessKeyId as string,
    secretAccessKey: config.aws.secretAccessKey as string,
  },
});

/**
 * Delete file from S3 by its public URL
 * @param {string} fileUrl - The full URL of the file to delete
 * @returns {Promise<void>}
 */
export const deleteFromS3ByUrl = async (fileUrl: string): Promise<void> => {
  const bucketName = config.aws.bucketName;

  if (!bucketName) {
    throw new Error("S3 bucket name is not defined in the configuration.");
  }

  // Extract the key from the URL
  try {
    const url = new URL(fileUrl);
    const key = url.pathname.slice(1); // Remove the leading "/"
    // console.log("Extracted Key:", key);

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);
    // console.log(`File deleted successfully: ${key}`);
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw new Error(`Failed to delete file from S3: ${fileUrl}`);
  }
};
