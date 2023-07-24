// /server/api/galleries/index.post.ts
import { addGalleries } from '.'

export default defineEventHandler(async (event) => {
  try {
    const galleriesData = await readBody(event)
    const result = await addGalleries(galleriesData)
    return { success: true, ...result }
  } catch (error) {
    return { success: false, message: 'failed to create a new gallery' }
  }
})
