// server/api/media/random.get.ts
import { randomMedia } from '.'

export default defineEventHandler(async () => {
  try {
    const media = await randomMedia()
    if (!media) throw new Error('No media available.')
    return { success: true, media }
  } catch (error) {
    return { success: false, message: 'Failed to fetch random media.' }
  }
})
