// ~/server/api/galleries/[name].random.ts
import { defineEventHandler } from 'h3'
import { getRandomImageByGalleryName } from '../..'

export default defineEventHandler(async (event) => {
  const galleryName = String(event.context.params?.name)

  if (!galleryName) {
    return { success: false, message: 'Invalid gallery name.' }
  }

  try {
    const image = await getRandomImageByGalleryName(galleryName)

    if (!image) {
      return { success: false, message: `No images found in gallery with name: ${galleryName}` }
    }

    return { success: true, image }
  }
  catch (error: unknown) {
    return {
      success: false,
      message: `Failed to get random image for gallery name ${galleryName}.`,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})
