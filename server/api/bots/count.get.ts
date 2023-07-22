// /server/api/bots/count.get.ts
import { ErrorHandler } from '../utils/error'
import { countBots } from '../utils/bot'

export default defineEventHandler((event) =>
  ErrorHandler(async () => {
    const count = await countBots()

    return { count }
  }, 'An error occurred while fetching bot count')
)
