// /server/api/galleries/[name].patch.ts
import { defineEventHandler, readBody, createError } from 'h3';
import { fetchGalleryByName, updateGallery } from '..'; // Import the correct methods

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
    // Fetch the gallery from the database by its name
    const gallery = await fetchGalleryByName(name);

    if (!gallery) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Gallery with name '${name}' not found.`,
      });
    }

    // Read and parse the body of the request
    const data = await readBody(event);

    // Update the gallery using its ID and the provided data
    const updatedGallery = await updateGallery(gallery.id, data);

    return { success: true, gallery: updatedGallery };
  } catch (error: unknown) {
    // Handle any errors that occur during the update process
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Failed to update gallery with name '${name}'. Reason: ${errorMessage}`,
    };
  }
});
