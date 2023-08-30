// server/api/projects/count.get.ts
import { countUsers } from '.'

export default defineEventHandler(async () => {
  try {
    const count = await countUsers()
    return { success: true, count }
  } catch (error) {
    return { success: false, message: 'Failed to get projects count.' }
  }
})
