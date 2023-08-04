// server/api/galleries/[id].delete.ts
import { deleteGallery } from '..'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid Gallery ID.')
  try {
    const deleted = await deleteGallery(id)
    if (!deleted) throw new Error(`Gallery with id ${id} does not exist.`)
    return { success: true, message: `Gallery with id ${id} successfully deleted.` }
  } catch (error) {
    return { success: false, message: `Failed to delete Gallery with id ${id}.` }
  }
})
