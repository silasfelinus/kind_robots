// server/api/randomimage.get.ts
import { defineEventHandler } from 'h3';
import { fetchRandomImage } from '../..';

export default defineEventHandler(async () => {
  try {
    const image = await fetchRandomImage();

    if (!image) {
      throw new Error(`No images available.`);
    }

    return { success: true, image };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to fetch a random image.',
      error: error.message,
    };
  }
});
