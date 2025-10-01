import fs from "fs";
import sharp from "sharp";

/**
 * Compress and optimize image for web/mobile
 * @param {string} filePath - Local file path
 * @param {string} mimeType - File MIME type
 * @returns {Promise<{buffer: Buffer, contentType: string, extension: string}>}
 */

export const compressImage = async (
  filePath: string,
  mimeType: string
): Promise<{ buffer: Buffer; contentType: string; extension: string }> => {
  const fileStream = fs.createReadStream(filePath);
  const metadata = await sharp(filePath).metadata();

  let sharpInstance = sharp();

  // Resize for web/mobile optimization
  const maxWidth = 1200;
  const maxHeight = 1200;

  if (metadata.width && metadata.width > maxWidth) {
    sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  // Check if image has transparency
  const hasAlpha = metadata.channels === 4 || mimeType.includes("png");

  let outputFormat: string;
  let contentType: string;
  let extension: string;

  if (hasAlpha) {
    // Use WebP for transparency (fallback to PNG if needed)
    outputFormat = "webp";
    contentType = "image/webp";
    extension = ".webp";
    sharpInstance = sharpInstance.webp({
      quality: 85,
      effort: 4,
      lossless: false,
    });
  } else {
    // Use WebP for photos (best compression for web/mobile)
    outputFormat = "webp";
    contentType = "image/webp";
    extension = ".webp";
    sharpInstance = sharpInstance.webp({
      quality: 82,
      effort: 4,
    });
  }

  // Process image with stream
  return new Promise<{
    buffer: Buffer;
    contentType: string;
    extension: string;
  }>((resolve, reject) => {
    const chunks: Buffer[] = [];

    fileStream
      .pipe(sharpInstance)
      .on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      })
      .on("end", () => {
        resolve({
          buffer: Buffer.concat(chunks),
          contentType,
          extension,
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};
