import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { deleteMessage } from './index'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const isDeleted = await deleteMessage(id)
    return { success: isDeleted }
  } catch (error: any) {
    return errorHandler(error)
  }
})
