// /server/api/galleries/index.post.ts
import { defineEventHandler, readBody } from 'h3';
import { addGalleries } from '..'; // Import the correct function

export default defineEventHandler(async (event) => {
  try {
    // Read the galleries data from the request body
    const galleriesData = await readBody(event);

    // Add the galleries to the database
    const result = await addGalleries(galleriesData);

    return { success: true, ...result };
  } catch (error: any) {
    return { success: false, message: 'Failed to create new galleries', error: error.message };
  }
});
