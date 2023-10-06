import { defineEventHandler, readBody } from 'h3'
import { Art } from '@prisma/client'
import { errorHandler } from '../utils/error'

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

// Function to update an existing Art entry by ID
export async function updateArt(id: number, updatedArt: Partial<Art>): Promise<Art | null> {
  try {
    return await prisma.art.update({
      where: { id },
      data: updatedArt
    })
  } catch (error: any) {
    throw errorHandler(error)
  }
}
