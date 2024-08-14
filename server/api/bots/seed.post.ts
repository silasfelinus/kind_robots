// server/api/bots/seed.post.ts
import { defineEventHandler } from 'h3'
import { botData } from '../../../stores/seeds/seedBots'
import { updateBots } from '.' // Adjust import according to your file structure

export default defineEventHandler(async () => {
  try {
    // Call the updateBots function with predefined seed data
    const result = await updateBots(botData)
    return { success: true, ...result }
  } catch (error: unknown) {
    // Return a structured error response
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      message: 'Failed to update bots',
      error: errorMessage,
    }
  }
})
