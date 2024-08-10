// /server/api/bots/[name].patch.ts
import { defineEventHandler, readBody } from 'h3'
import { fetchBotByName, updateBot } from '../../bots'

export default defineEventHandler(async (event) => {
  const name = String(event.context.params?.name)
  if (!name) throw new Error('Invalid bot name.')
  try {
    // Fetch the bot from the database
    const bot = await fetchBotByName(name)

    // Make sure to await the Promise returned by readBody
    const data = await readBody(event)

    if (!bot) {
      throw new Error('Bot not found.')
    }

    // Update only the provnameed fields
    const updatedBot = await updateBot(name, data)

    return { success: true, bot: updatedBot }
  }
  catch (error) {
    return { success: false, message: `Failed to update bot with name ${name}.` }
  }
})
