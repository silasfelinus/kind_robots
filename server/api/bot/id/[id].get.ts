// server/api/bots/[id].get.ts
import { defineEventHandler } from 'h3'
import { fetchBotById } from '../../bots'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) {
    return { success: false, message: 'Invalid bot ID.' }
  }

  try {
    const bot = await fetchBotById(id)

    if (!bot) {
      return { success: false, message: `Bot with id ${id} does not exist.` }
    }

    return { success: true, bot }
  }
  catch (error: unknown) {
    console.error(`Failed to fetch bot with id ${id}:`, (error as Error).message)
    return { success: false, message: `Failed to fetch bot with id ${id}: ${(error as Error).message}` }
  }
})
