import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import { Art, updateArt } from '.'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const updatedArtData: Partial<Art> = await readBody(event)
    const updatedArt = await updateArt(id, updatedArtData)
    return { success: true, updatedArt }
  } catch (error: any) {
    return errorHandler(error)
  }
})
