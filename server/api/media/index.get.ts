// ~/server/api/media/index.get.ts
import { fetchMedia } from '.'

export default defineEventHandler(async (event) => {
  try {
    const page = Number(event.context.query?.page) || 1
    const pageSize = Number(event.context.query?.pageSize) || 100
    const media = await fetchMedia(page, pageSize)
    return { success: true, media }
  } catch (error) {
    return { success: false, message: 'Failed to fetch media.' }
  }
})
