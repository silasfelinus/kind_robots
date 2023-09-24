import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { deleteChannel } from './index'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const isDeleted = await deleteChannel(id)
    return { success: isDeleted }
  } catch (error: any) {
    return errorHandler(error)
  }
})
