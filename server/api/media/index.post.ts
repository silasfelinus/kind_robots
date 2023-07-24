// /server/api/media/index.post.ts
import { addMedia } from '.'

export default defineEventHandler(async (event) => {
  try {
    const mediaData = await readBody(event)
    const result = await addMedia(mediaData)
    return { success: true, ...result }
  } catch (error) {
    return { success: false, message: 'failed to create a new game' }
  }
})
