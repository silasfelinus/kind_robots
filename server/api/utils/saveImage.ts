import fs from 'fs/promises';
import path from 'path';
import { errorHandler } from '../utils/error';

export async function saveImage(base64Image: string, galleryName: string): Promise<string> {
  try {
    const timestamp = Date.now();
    const fileName = `${galleryName}-${timestamp}.webp`;
    const dirPath = path.join(process.env.IMAGES_PATH || './public/images', galleryName);
    const filePath = path.join(dirPath, fileName);

    // Ensure the gallery directory exists
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }

    // Save the image
    await fs.writeFile(filePath, base64Image, 'base64');

    return filePath;
  } catch (error: any) {
    throw errorHandler(error);
  }
}
