// server/api/galleries/count.get.ts
import { defineEventHandler } from 'h3';
import { countGalleries } from '.';
import { errorHandler } from '../utils/error';


export default defineEventHandler(async () => {
  try {
    // Get the count of galleries
    const count = await countGalleries();

    // Return the success response with count
    return { success: true, count };
  } catch (error: unknown) {
    // Use the errorHandler to handle and format the error
    const handledError = errorHandler(error);
    return {
      success: false,
      message: handledError.message || 'Failed to get galleries count.',
      statusCode: handledError.statusCode || 500,
    };
  }
});
