import { fetchGameById } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid game ID.')
  try {
    const game = await fetchGameById(id)

    if (!game) {
      throw new Error(`Game with id ${id} does not exist.`)
    }

    return { success: true, game }
  } catch (error) {
    return { success: false, message: `Failed to fetch game with id ${id}.` }
  }
})
