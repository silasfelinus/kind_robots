import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchArtById } from '.'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const art = await fetchArtById(id)
    return { success: true, art }
  } catch (error: any) {
    return errorHandler(error)
  }
})
