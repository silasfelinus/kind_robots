// server/api/bots/[id].delete.ts
import { deleteMedia } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid media ID.')
  try {
    const deleted = await deleteMedia(id)
    if (!deleted) throw new Error(`Media with id ${id} does not exist.`)
    return { success: true, message: `Media with id ${id} successfully deleted.` }
  } catch (error) {
    return { success: false, message: `Failed to delete media with id ${id}.` }
  }
})
