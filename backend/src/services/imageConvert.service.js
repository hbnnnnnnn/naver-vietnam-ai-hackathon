import sharp from "sharp";
import path from "path";
import fs from "fs";
import { promisify } from "util";
let heicConvert;
try {
  heicConvert = require("heic-convert");
} catch (e) {
  heicConvert = null;
}

/**
 * Converts an image to PNG format if not already PNG.
 * Returns the path to the PNG image (original if already PNG, otherwise new file).
 * @param {string} imagePath - Path to the input image file
 * @returns {Promise<string>} - Path to PNG image
 */
export async function convertImageToPng(imagePath) {
  const ext = path.extname(imagePath).toLowerCase();
  if (ext === ".png") {
    return imagePath;
  }
  const dir = path.dirname(imagePath);
  const base = path.basename(imagePath, ext || undefined); // Remove extension if present
  const pngPath = path.join(dir, base + ".png");
  // Only convert if PNG doesn't already exist
  if (!fs.existsSync(pngPath)) {
    if ([".heic", ".heif"].includes(ext)) {
      if (!heicConvert) {
        throw new Error("heic-convert library is required to convert HEIC images. Please install it with 'npm install heic-convert'.");
      }
      const inputBuffer = fs.readFileSync(imagePath);
      const outputBuffer = await heicConvert({
        buffer: inputBuffer,
        format: "PNG",
        quality: 1
      });
      await fs.promises.writeFile(pngPath, outputBuffer);
    } else {
      await sharp(imagePath).png().toFile(pngPath);
    }
  }
  return pngPath;
}
