// server/api/bots/[id].get.ts
import { ErrorHandler } from '../utils/error'
import { findBot } from '../utils/bot'

export default defineEventHandler((event) =>
  ErrorHandler(async () => {
    const id = Number(event.context.params?.id)

    const bot = await findBot(id)

    return bot
  }, 'Bot not found')
)
