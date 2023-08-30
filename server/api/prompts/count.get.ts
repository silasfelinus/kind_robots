// /server/api/prompts/count.get.ts
import { countPrompts } from '.'

export default defineEventHandler(async () => {
  try {
    const count = await countPrompts()
    return { success: true, count }
  } catch (error) {
    return { success: false, message: 'Failed to get prompts count.' }
  }
})
