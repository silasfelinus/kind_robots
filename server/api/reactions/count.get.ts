// ~/server/api/reactions/count.get.ts
import { countReactions } from '.'

export default defineEventHandler(async () => {
  try {
    const count = await countReactions()
    return { success: true, count }
  } catch (error) {
    return { success: false, message: 'Failed to get reactions count.' }
  }
})
