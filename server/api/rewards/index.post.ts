// /server/api/rewads/index.post.ts
import { addRewards } from '.'
export default defineEventHandler(async (event) => {
  try {
    const rewardsData = await readBody(event)

    if (!Array.isArray(rewardsData)) {
      return { success: false, message: 'Invalid JSON body' }
    }

    const result = await addRewards(rewardsData)
    return { success: true, ...result }
  } catch (error: any) {
    return { success: false, message: 'Failed to create new rewards', error: error.message }
  }
})
