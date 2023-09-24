import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchArtReactionById } from '.'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const reaction = await fetchArtReactionById(id)
    return { success: true, reaction }
  } catch (error: any) {
    return errorHandler(error)
  }
})
