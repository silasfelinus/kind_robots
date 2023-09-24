import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchChannelById } from './index'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const channel = await fetchChannelById(id)
    return { success: true, channel }
  } catch (error: any) {
    return errorHandler(error)
  }
})
