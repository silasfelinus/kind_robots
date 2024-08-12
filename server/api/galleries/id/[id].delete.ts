// server/api/galleries/[id].delete.ts
import { defineEventHandler, createError } from 'h3';
import { deleteGallery } from '..';
import { errorHandler } from '../../utils/error';

export default defineEventHandler(async (event) => {
  // Extract and validate the ID from the request parameters
  const id = Number(event.context.params?.id);

  if (isNaN(id) || id <= 0) {
    throw createError({
      statusCode: 400, // Bad Request
      message: 'Invalid Gallery ID.',
    });
  }

  try {
    // Attempt to delete the gallery
    const deleted = await deleteGallery(id);

    if (!deleted) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Gallery with id ${id} does not exist.`,
      });
    }

    return { success: true, message: `Gallery with id ${id} successfully deleted.` };
  } catch (error: unknown) {
    // Handle errors consistently
    const handledError = errorHandler(error);
    return {
      success: false,
      message: handledError.message || `Failed to delete Gallery with id ${id}.`,
      statusCode: handledError.statusCode || 500, // Internal Server Error
    };
  }
});
