import { defineEventHandler, readBody } from 'h3'
import { Art } from '@prisma/client'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const artData: Partial<Art> = await readBody(event)
    const newArt = await createArt(artData)
    return { success: true, newArt }
  } catch (error: any) {
    return errorHandler(error)
  }
})
