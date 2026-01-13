import sharp from "sharp";
import { Request, Response, NextFunction } from "express";
import fs from "fs";

export const validateImageContent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) return next();

  try {
    // Sharp will throw if file is not a real image
    await sharp(req.file.path).metadata();
    next();
  } catch {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      success: false,
      message: "Invalid or corrupted image file",
    });
  }
};
