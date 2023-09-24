// ~/server/api/galleries/[name].random.ts
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
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to geet random image for gallery name ${galleryName}.`,
      error: error.message
    }
  }
})
