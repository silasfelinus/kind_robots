// server/api/galleries/[name].get.ts
import { defineEventHandler, createError } from 'h3';
import { fetchGalleryByName } from '..';

export default defineEventHandler(async (event) => {
  // Extract and validate the gallery name from the request parameters
  const name = String(event.context.params?.name).trim();

  if (!name) {
    throw createError({
      statusCode: 400, // Bad Request
      message: 'Gallery name is required.',
    });
  }

  try {
    // Fetch the gallery by name
    const gallery = await fetchGalleryByName(name);

    if (!gallery) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Gallery with name '${name}' does not exist.`,
      });
    }

    return { success: true, gallery };
  } catch (error: unknown) {
    // Use the error handler to provide a consistent error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Failed to fetch gallery with name '${name}'. Reason: ${errorMessage}`,
    };
  }
});
