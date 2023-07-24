// server/api/projects/[id].get.ts
import { fetchProjectById } from '.'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!id) throw new Error('Invalid project ID.')
  try {
    const project = await fetchProjectById(id)

    if (!project) {
      throw new Error(`Project with id ${id} does not exist.`)
    }

    return { success: true, project }
  } catch (error) {
    return { success: false, message: `Failed to fetch project with id ${id}.` }
  }
})
