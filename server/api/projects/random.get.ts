// server/api/project/random.get.ts
import { randomProject } from '.'

export default defineEventHandler(async () => {
  try {
    const Project = await randomProject()
    if (!Project) throw new Error('No Project available.')
    return { success: true, Project }
  } catch (error) {
    return { success: false, message: 'Failed to fetch random Project.' }
  }
})
