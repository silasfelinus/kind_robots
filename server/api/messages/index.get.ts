import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchAllMessages } from './index'

export default defineEventHandler(async () => {
  try {
    const messages = await fetchAllMessages()
    return { success: true, messages }
  } catch (error: any) {
    return errorHandler(error)
  }
})
