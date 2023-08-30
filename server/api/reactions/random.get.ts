// server/api/reactions/random.get.ts
import { randomReaction } from '.'

export default defineEventHandler(async () => {
  try {
    const reaction = await randomReaction()
    if (!reaction) throw new Error('No reactions available.')
    return { success: true, reaction }
  } catch (error) {
    return { success: false, message: 'Failed to fetch random reaction.' }
  }
})
