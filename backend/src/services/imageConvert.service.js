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
    let buffer;
    // Always downscale to max 512x512 to remove HD quality
    const maxDimension = 512;
    if ([".heic", ".heif"].includes(ext)) {
      if (!heicConvert) {
        throw new Error("heic-convert library is required to convert HEIC images. Please install it with 'npm install heic-convert'.");
      }
      const inputBuffer = fs.readFileSync(imagePath);
      buffer = await heicConvert({
        buffer: inputBuffer,
        format: "PNG",
        quality: 1
      });
      // Downscale to max 512x512 before compression
      buffer = await sharp(buffer)
        .resize({ width: maxDimension, height: maxDimension, fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer();
      // Compress HEIC-converted images to below 300KB
      if (buffer.length > 300 * 1024) {
        let width = maxDimension;
        let quality = 80;
        let compressionLevel = 9;
        let attempts = 0;
        do {
          buffer = await sharp(buffer)
            .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
            .png({ quality, compressionLevel })
            .toBuffer();
          if (buffer.length <= 300 * 1024) break;
          width = Math.max(64, Math.floor(width * 0.7));
          quality = Math.max(10, Math.floor(quality * 0.7));
          attempts++;
        } while (buffer.length > 300 * 1024 && attempts < 15);
        // Fallback: force compress if still too large
        if (buffer.length > 300 * 1024) {
          buffer = await sharp(buffer)
            .resize({ width: 64, height: 64, fit: 'inside', withoutEnlargement: true })
            .png({ quality: 10, compressionLevel: 9 })
            .toBuffer();
        }
      }
    } else {
      // Downscale to max 512x512 before compression
      buffer = await sharp(imagePath)
        .resize({ width: maxDimension, height: maxDimension, fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer();
      // Try resizing and compressing until under 300KB
      let width = maxDimension;
      let quality = 80;
      let compressionLevel = 9;
      let attempts = 0;
      do {
        buffer = await sharp(buffer)
          .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
          .png({ quality, compressionLevel })
          .toBuffer();
        if (buffer.length <= 300 * 1024) break;
        width = Math.max(64, Math.floor(width * 0.7));
        quality = Math.max(10, Math.floor(quality * 0.7));
        attempts++;
      } while (buffer.length > 300 * 1024 && attempts < 15);
      // Fallback: force compress if still too large
      if (buffer.length > 300 * 1024) {
        buffer = await sharp(buffer)
          .resize({ width: 64, height: 64, fit: 'inside', withoutEnlargement: true })
          .png({ quality: 10, compressionLevel: 9 })
          .toBuffer();
      }
    }
    await fs.promises.writeFile(pngPath, buffer);
  }
  return pngPath;
}
