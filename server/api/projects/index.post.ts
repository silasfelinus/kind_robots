// /server/api/projects/index.post.ts
import { addProjects } from '.'

export default defineEventHandler(async (event) => {
  try {
    const projectsData = await readBody(event)
    const result = await addProjects(projectsData)
    return { success: true, ...result }
  } catch (error) {
    return { success: false, message: 'Failed to create new projects.' }
  }
})
