// server/api/projects/[id].delete.ts
import { deleteProject } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid project ID.')
  try {
    const deleted = await deleteProject(id)
    if (!deleted) throw new Error(`Project with id ${id} does not exist.`)
    return { success: true, message: `Project with id ${id} successfully deleted.` }
  } catch (error) {
    return { success: false, message: `Failed to delete project with id ${id}.` }
  }
})
