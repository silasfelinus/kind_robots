// server/api/randomimage.get.ts
import { defineEventHandler } from 'h3';
import { fetchRandomImage } from '../..';

interface RandomImageResponse {
  success: boolean;
  image?: string;
  message?: string;
  error?: string;
}

export default defineEventHandler(async (): Promise<RandomImageResponse> => {
  try {
    // Fetch a random image
    const image = await fetchRandomImage();

    // Check if an image was found
    if (!image) {
      return {
        success: false,
        message: 'No images available.',
        error: 'No image found',
      };
    }

    // Return the success response with the image
    return { success: true, image };
  } catch (error: unknown) {
    // Return the error response with a detailed message
    return {
      success: false,
      message: 'Failed to fetch a random image.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});
