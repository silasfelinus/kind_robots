// server/api/Galleriess/index.get.ts
import { defineEventHandler } from 'h3';
import { fetchGalleries } from '.';
import { errorHandler } from '../utils/error';

export default defineEventHandler(async () => {
  try {
    // Fetch galleries
    const galleries: Gallery[] = await fetchGalleries();

    // Return success response with galleries data
    return { success: true, galleries };
  } catch (error: unknown) {
    // Use the errorHandler to handle and format the error
    const handledError = errorHandler(error);
    return {
      success: false,
      message: 'Failed to fetch galleries.',
      error: handledError.message,
      statusCode: handledError.statusCode || 500,
    };
  }
});
