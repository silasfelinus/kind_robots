// server/api/resources/[id].delete.ts
import { deleteResource } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid Resource ID.')
  try {
    const deleted = await deleteResource(id)
    if (!deleted) throw new Error(`Resource with id ${id} does not exist.`)
    return { success: true, message: `Resource with id ${id} successfully deleted.` }
  } catch (error) {
    return { success: false, message: `Failed to delete Resource with id ${id}.` }
  }
})
