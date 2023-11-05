// server/api/galleries/[name].get.ts
import { defineEventHandler } from 'h3';
import { fetchGalleryByName } from '..';

export default defineEventHandler(async (event) => {
  const name = String(event.context.params?.name);
  try {
    const gallery = await fetchGalleryByName(name);

    if (!gallery) {
      throw new Error(`Gallery with name '${name}' does not exist. Context was: ${JSON.stringify(event.context)}`);
    }

    return { success: true, gallery };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to fetch gallery with name ${name}. Reason: ${error.message}`,
    };
  }
});
