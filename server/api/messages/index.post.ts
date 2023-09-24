import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import { Message, createMessage } from './index'

export default defineEventHandler(async (event) => {
  try {
    const messageData: Partial<Message> = await readBody(event)
    const newMessage = await createMessage(messageData)
    return { success: true, newMessage }
  } catch (error: any) {
    return errorHandler(error)
  }
})
