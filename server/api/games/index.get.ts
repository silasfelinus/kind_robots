// ~/server/api/games/index.get.ts
import { fetchGames } from '.'

export default defineEventHandler(async (event) => {
  try {
    const page = Number(event.context.query?.page) || 1
    const pageSize = Number(event.context.query?.pageSize) || 10
    const games = await fetchGames(page, pageSize)
    return { success: true, games }
  } catch (error) {
    return { success: false, message: 'Failed to fetch games.' }
  }
})
