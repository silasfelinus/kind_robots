// /server/api/bot/id/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import { fetchBotById, updateBot } from '../../bots'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)

  if (!id) {
    return { success: false, message: 'Invalid bot id.' }
  }

  try {
    // Fetch the bot from the database
    const bot = await fetchBotById(id)

    if (!bot) {
      return { success: false, message: `Bot with id "${id}" not found.` }
    }

    // Read the body data
    const data = await readBody(event)

    // Update only the provided fields
    const updatedBot = await updateBot(id, data)

    return { success: true, bot: updatedBot }
  } catch (error: unknown) {
    console.error(
      `Failed to update bot with id "${id}": ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    return {
      success: false,
      message: `Failed to update bot with id "${id}". ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
})
