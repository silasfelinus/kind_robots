// server/api/bots/seed.post.ts
import { defineEventHandler } from 'h3'
import { botData } from '../../../stores/seeds/seedBots'
import { updateBots } from '.'

export default defineEventHandler(async (event) => {
  try {
    const result = await updateBots(botData)
    return { success: true, ...result }
  }
  catch (error: any) {
    return { success: false, message: 'Failed to update bots', error: error.message }
  }
})
