// ~/server/api/media/count.get.ts
import { countMedia } from '.'

export default defineEventHandler(async () => {
  try {
    const count = await countMedia()
    return { success: true, count }
  } catch (error) {
    return { success: false, message: 'Failed to get projects count.' }
  }
})
