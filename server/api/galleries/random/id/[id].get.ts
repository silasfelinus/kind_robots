// ~/server/api/galleries/random/id/[id].get.ts
import { defineEventHandler } from 'h3';
import { getRandomGalleryImage } from '../..';

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);
  try {
    let image;
    if (id) {
      // If there is an ID, get a random image from that gallery
      image = await getRandomGalleryImage(id);
    } else {
      return console.error(`ID not found`);
    }

    return image;
  } catch (error) {
    return console.error(`Failed to get random image: ${error}`);
  }
});
