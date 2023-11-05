// /server/api/galleries/[id].patch.ts
import { defineEventHandler, readBody } from 'h3';
import { fetchGalleryById, updateGallery } from '..';

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);
  if (!id) throw new Error('Invalid Gallery ID.');
  try {
    // Fetch the Gallery from the database
    const Gallery = await fetchGalleryById(id);

    // Make sure to await the Promise returned by readBody
    const data = await readBody(event);

    if (!Gallery) {
      throw new Error('Gallery not found.');
    }

    // Update only the provided fields
    const updatedGallery = await updateGallery(id, data);

    return { success: true, Gallery: updatedGallery };
  } catch (error) {
    return { success: false, message: `Failed to update Gallery with id ${id}.` };
  }
});
