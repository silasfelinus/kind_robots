// server/api/projects/count.get.ts
import { countBots } from '.'

export default defineEventHandler(async () => {
  try {
    const count = await countBots()
    return { success: true, count }
  } catch (error) {
    return { success: false, message: 'Failed to get projects count.' }
  }
})
