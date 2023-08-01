// /server/api/bots/[id].patch.ts
import { fetchBotById, updateBot } from '../../bots'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid bot ID.')
  try {
    // Fetch the bot from the database
    const bot = await fetchBotById(id)

    // Make sure to await the Promise returned by readBody
    const data = await readBody(event)

    if (!bot) {
      throw new Error('Bot not found.')
    }

    // Update only the provided fields
    const updatedBot = await updateBot(id, data)

    return { success: true, bot: updatedBot }
  } catch (error) {
    return { success: false, message: `Failed to update bot with id ${id}.` }
  }
})
