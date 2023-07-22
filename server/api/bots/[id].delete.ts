// server/api/bots/[id].delete.ts
import { ErrorHandler } from '../utils/error'
import { deleteBot, findBot } from '../utils/bot'

export default defineEventHandler((event) =>
  ErrorHandler(async () => {
    const id = Number(event.context.params?.id)

    // Fetch the bot from the database
    await findBot(id)

    // Delete the bot
    await deleteBot(id)
    return { message: `Bot with id ${id} successfully deleted.` }
  }, 'An error occurred while deleting the bot.')
)
