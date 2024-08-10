// server/api/projects/count.get.ts
import { defineEventHandler } from 'h3'
import { countBots } from '.'

export default defineEventHandler(async () => {
  try {
    const count = await countBots()
    return { success: true, count }
  }
  catch (error) {
    return { success: false, message: 'Failed to get projects count.' }
  }
})
