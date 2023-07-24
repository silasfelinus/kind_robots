// server/api/projects/index.get.ts
import { fetchProjects } from '.'

export default defineEventHandler(async (event) => {
  try {
    const page = Number(event.context.query?.page) || 1
    const pageSize = Number(event.context.query?.pageSize) || 10
    const projects = await fetchProjects(page, pageSize)
    return { success: true, projects }
  } catch (error) {
    return { success: false, message: 'Failed to fetch projects.' }
  }
})
