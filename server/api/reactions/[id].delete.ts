import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { deleteArtReaction } from '.'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const isDeleted = await deleteArtReaction(id)
    return { success: isDeleted }
  }
  catch (error: unknown) {
    return errorHandler(error)
  }
})
