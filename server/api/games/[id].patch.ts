import { fetchGameById, updateGame } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid game ID.')
  try {
    const game = await fetchGameById(id)
    const data = await readBody(event)

    if (!game) {
      throw new Error('Game not found.')
    }

    const updatedGame = await updateGame(id, data)

    return { success: true, game: updatedGame }
  } catch (error) {
    return { success: false, message: `Failed to update game with id ${id}.` }
  }
})
