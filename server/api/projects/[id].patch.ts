// /server/api/projects/[id].patch.ts
import { fetchProjectById, updateProject } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid project ID.')
  try {
    // Fetch the project from the database
    const project = await fetchProjectById(id)

    // Make sure to await the Promise returned by readBody
    const data = await readBody(event)

    if (!project) {
      throw new Error('Project not found.')
    }

    // Update only the provided fields
    const updatedProject = await updateProject(id, data)

    return { success: true, project: updatedProject }
  } catch (error) {
    return { success: false, message: `Failed to update project with id ${id}.` }
  }
})
