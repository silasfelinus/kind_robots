import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchAllReactions } from '.'

export default defineEventHandler(async () => {
  try {
    const reactions = await fetchAllReactions()
    return { success: true, reactions }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
