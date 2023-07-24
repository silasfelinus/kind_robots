// ~/server/api/reactions/[id].delete.ts
import { deleteReaction } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid reaction ID.')
  try {
    const deleted = await deleteReaction(id)
    if (!deleted) throw new Error(`Reaction with id ${id} does not exist.`)
    return { success: true, message: `Reaction with id ${id} successfully deleted.` }
  } catch (error) {
    return { success: false, message: `Failed to delete Reaction with id ${id}.` }
  }
})
