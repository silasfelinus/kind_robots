// /server/api/galleries/index.post.ts
import { addGalleries } from '.'

export default defineEventHandler(async (event) => {
  try {
    const galleryData = await readBody(event)
    const result = await addGalleries(galleryData)
    return { success: true, ...result }
  } catch (error: any) {
    return { success: false, message: 'Failed to create a new galleries', error: error.message }
  }
})
