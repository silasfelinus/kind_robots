// server/api/bots/random.get.ts
import { defineEventHandler } from 'h3'
import { randomBot } from '../bots'

export default defineEventHandler(async () => {
  try {
    const bot = await randomBot()
    if (!bot) {
      return { success: false, message: 'No bots available.' }
    }
    return { success: true, bot }
  } catch (error: unknown) {
    console.error('Failed to fetch a random bot:', (error as Error).message)
    return { success: false, message: 'Failed to fetch a random bot.' }
  }
})
