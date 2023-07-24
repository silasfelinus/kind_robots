// server/api/projects/count.get.ts
import { countProjects } from '.'

export default defineEventHandler(async () => {
  try {
    const count = await countProjects()
    return { success: true, count }
  } catch (error) {
    return { success: false, message: 'Failed to get projects count.' }
  }
})
