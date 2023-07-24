// /server/api/games/index.post.ts
import { addGames } from '.'

export default defineEventHandler(async (event) => {
  try {
    const gamesData = await readBody(event)
    const result = await addGames(gamesData)
    return { success: true, ...result }
  } catch (error) {
    return { success: false, message: 'failed to create a new game' }
  }
})
