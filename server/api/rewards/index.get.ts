// /server/api/rewards/index.get.ts
// /server/api/rewards/index.get.ts
import { defineEventHandler } from 'h3'
import { fetchAllRewards } from './'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  try {
    const rewards = await fetchAllRewards()
    return { success: true, rewards }
  } catch (error: unknown) {
    const { success, message, statusCode } = errorHandler(error)
    return { success, message, statusCode }
  }
})
