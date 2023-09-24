import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import { Channel, createChannel } from './index'

export default defineEventHandler(async (event) => {
  try {
    const channelData: Partial<Channel> = await readBody(event)
    const newChannel = await createChannel(channelData)
    return { success: true, newChannel }
  } catch (error: any) {
    return errorHandler(error)
  }
})
