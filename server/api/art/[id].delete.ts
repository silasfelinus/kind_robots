import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { deleteArt } from '.'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const isDeleted = await deleteArt(id)
    return { success: isDeleted }
  } catch (error: any) {
    return errorHandler(error)
  }
})
