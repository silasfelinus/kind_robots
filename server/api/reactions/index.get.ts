import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchAllArtReactions } from '.'

export default defineEventHandler(async () => {
  try {
    const reactions = await fetchAllArtReactions()
    return { success: true, reactions }
  }
  catch (error: any) {
    return errorHandler(error)
  }
})
