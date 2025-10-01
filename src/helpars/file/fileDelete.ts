import fs from "fs";
import path from "path";

/**
 * Deletes a file from the uploads folder if an error occurs.
 * @param filePath The path of the file to delete.
 */

export const deleteFile = async (fileUrl: string) => {
  try {
    // Extract the filename from the URL
    const filename = path.basename(new URL(fileUrl).pathname);
    const fullPath = path.join(process.cwd(), "uploads", filename);

    // console.log(filename, fullPath);

    await fs.promises.access(fullPath);
    await fs.promises.unlink(fullPath);
    // console.log(`Deleted file: ${filename}`);
  } catch (error) {
    console.error(`Failed to delete file: ${fileUrl}`, error);
  }
};
