// ~/server/api/games/count.get.ts
import { countGames } from '.'

export default defineEventHandler(async () => {
  try {
    const count = await countGames()
    return { success: true, count }
  } catch (error) {
    return { success: false, message: 'Failed to get games count.' }
  }
})
