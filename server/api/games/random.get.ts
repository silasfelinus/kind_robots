import { randomGame } from '.'

export default defineEventHandler(async () => {
  try {
    const game = await randomGame()
    if (!game) {
      throw new Error(`No games available.`)
    }
    return { success: true, game }
  } catch (error) {
    return { success: false, message: 'No game available' }
  }
})
