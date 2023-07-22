// server/api/bots/random.get.ts
import { ErrorHandler } from '../utils/error'
import { randomBot } from '../utils/bot'

export default defineEventHandler((event) =>
  ErrorHandler(async () => {
    const bot = await randomBot()

    return bot
  }, 'Bot not found')
)
