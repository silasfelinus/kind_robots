// server/api/bots/random.get.ts
import { randomBot } from '.'

export default defineEventHandler(async () => {
  try {
    const bot = await randomBot()
    if (!bot) {
      throw new Error(`No bots available.`)
    }
    return { success: true, bot }
  } catch (error) {
    return { success: false, message: 'No bot available' }
  }
})
