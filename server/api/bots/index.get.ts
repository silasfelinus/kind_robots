// server/api/bots/index.get.ts
import { ErrorHandler } from '../utils/error'
import { getBots } from '../utils/bot'

export default defineEventHandler((event) =>
  ErrorHandler(async () => {
    const bots = await getBots()

    return bots
  }, 'An error occurred while fetching bots')
)
