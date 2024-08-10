// /server/api/galleries/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { addGalleries } from '.'

export default defineEventHandler(async (event) => {
  try {
    const galleryData = await readBody(event)

    if (!Array.isArray(galleryData)) {
      return {
        success: false,
        message: 'Expected the gallery data to be an array.',
        error: 'Invalid data format',
      }
    }

    const result = await addGalleries(galleryData)

    return { success: true, ...result }
  }
  catch (error: any) {
    return { success: false, message: 'Failed to create a new galleries', error: error.message }
  }
})
