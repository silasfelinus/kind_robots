// /server/api/bots/index.post.ts
import { ErrorHandler } from '../utils/error'
import { createManyBots } from '../utils/bot'

export default defineEventHandler((event) =>
  ErrorHandler(async () => {
    const body = await readBody(event)

    // Creating a single bot.
    // Enclose the body inside an array to match the new function signature.
    const newBotsCount = await createManyBots([body])

    return { botsCreated: newBotsCount }
  }, 'An error occurred while creating bot.')
)
