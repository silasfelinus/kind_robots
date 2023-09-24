import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchAllChannels } from './index'

export default defineEventHandler(async () => {
  try {
    const channels = await fetchAllChannels()
    return { success: true, channels }
  } catch (error: any) {
    return errorHandler(error)
  }
})
