import { defineEventHandler, readBody } from 'h3'
import type { Art } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)

    if (isNaN(id)) {
      return { success: false, message: 'Invalid ID' }
    }

    const updatedArtData: Partial<Art> = await readBody(event)

    if (!updatedArtData) {
      return { success: false, message: 'No data provided for update' }
    }

    const updatedArt = await updateArt(id, updatedArtData)

    if (!updatedArt) {
      return { success: false, message: 'Art not found or update failed' }
    }

    return { success: true, updatedArt }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to update an existing Art entry by ID
export async function updateArt(
  id: number,
  updatedArt: Partial<Art>,
): Promise<Art | null> {
  try {
    const art = await prisma.art.update({
      where: { id },
      data: updatedArt,
    })
    return art
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
