// /server/api/bots/[name].patch.ts
import { defineEventHandler, readBody } from 'h3'
import { fetchBotByName, updateBot } from '../../bots'

export default defineEventHandler(async (event) => {
  const name = String(event.context.params?.name)

  if (!name) {
    return { success: false, message: 'Invalid bot name.' }
  }

  try {
    // Fetch the bot from the database
    const bot = await fetchBotByName(name)

    if (!bot) {
      return { success: false, message: `Bot with name "${name}" not found.` }
    }

    // Read the body data
    const data = await readBody(event)

    // Update only the provided fields
    const updatedBot = await updateBot(name, data)

    return { success: true, bot: updatedBot }
  } catch (error: unknown) {
    console.error(
      `Failed to update bot with name "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    return {
      success: false,
      message: `Failed to update bot with name "${name}". ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
})
