// server/api/bots/[id].delete.ts
import { deleteGame } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid game ID.')
  try {
    const deleted = await deleteGame(id)
    if (!deleted) throw new Error(`Game with id ${id} does not exist.`)
    return { success: true, message: `Game with id ${id} successfully deleted.` }
  } catch (error) {
    return { success: false, message: `Failed to delete game with id ${id}.` }
  }
})
