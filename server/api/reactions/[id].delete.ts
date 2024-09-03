import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { deleteReaction } from '.'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const isDeleted = await deleteReaction(id)
    return { success: isDeleted }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
