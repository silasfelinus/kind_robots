// /server/api/bots/[id].patch.ts

import { ErrorHandler } from '../utils/error'
import { findBot, updateBot } from '../utils/bot'

export default defineEventHandler((event) =>
  ErrorHandler(async () => {
    const body = await readBody(event)
    const id = Number(event.context.params?.id)

    if (!id) {
      throw new Error('Missing ID parameter.')
    }

    // Fetch the bot from the database
    const bot = await findBot(id)

    if (!bot) {
      throw new Error('Bot not found.')
    }

    // Update only the provided fields
    const updatedBot = await updateBot(id, body)

    return updatedBot
  }, 'An error occurred while updating the bot.')
)
