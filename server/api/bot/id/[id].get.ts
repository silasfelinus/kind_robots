// server/api/bots/[id].get.ts
import { defineEventHandler } from 'h3'
import { fetchBotById } from '../../bots'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)

  if (isNaN(id) || id <= 0) {
    return { success: false, message: 'Invalid bot ID.' }
  }

  try {
    const botResponse = await fetchBotById(id)

    if (!botResponse?.data?.bot) {
      return { success: false, message: `Bot with id ${id} does not exist.` }
    }

    return { success: true, data: { bot: botResponse.data.bot } }
  } catch (error: unknown) {
    console.error(
      `Failed to fetch bot with id ${id}:`,
      (error as Error).message,
    )
    return {
      success: false,
      message: `Failed to fetch bot with id ${id}: ${(error as Error).message}`,
    }
  }
})
