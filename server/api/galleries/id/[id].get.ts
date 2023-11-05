import { defineEventHandler } from 'h3';
import { fetchGalleryById } from '..';
import { errorHandler } from '../../utils/error';

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);
  if (!id) return errorHandler({ error: new Error('Invalid Gallery ID.'), context: 'Fetch Gallery' });

  try {
    const gallery = await fetchGalleryById(id);

    if (!gallery) {
      return errorHandler({
        error: new Error(`Gallery with id ${id} does not exist.`),
        context: 'Fetch Gallery',
      });
    }

    return { success: true, gallery };
  } catch (error: any) {
    return errorHandler({ error, context: 'Fetch Gallery' });
  }
});
