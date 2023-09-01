// /server/api/rewards/index.get.ts

import { fetchAllRewards } from '.' // Import your fetchAllRewards function

export default defineEventHandler(async () => {
  try {
    const rewards = await fetchAllRewards()
    return { success: true, rewards }
  } catch (error: any) {
    return { success: false, message: 'Failed to fetch rewards', error: error.message }
  }
})
