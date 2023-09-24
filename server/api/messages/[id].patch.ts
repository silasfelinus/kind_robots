import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import { Message, updateMessage } from './index'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const updatedMessageData: Partial<Message> = await readBody(event)
    const updatedMessage = await updateMessage(id, updatedMessageData)
    return { success: true, updatedMessage }
  } catch (error: any) {
    return errorHandler(error)
  }
})
