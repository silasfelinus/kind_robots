import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import { Channel, updateChannel } from './index'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const updatedChannelData: Partial<Channel> = await readBody(event)
    const updatedChannel = await updateChannel(id, updatedChannelData)
    return { success: true, updatedChannel }
  } catch (error: any) {
    return errorHandler(error)
  }
})
