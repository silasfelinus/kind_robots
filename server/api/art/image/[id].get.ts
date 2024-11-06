// server/api/art/image/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)

  try {
    // Validate the ID
    if (isNaN(id) || id <= 0) {
      throw new Error('Invalid ID provided.')
    }

    const artImage = await prisma.artImage.findUnique({
      where: { id },
    })

    if (!artImage) {
      throw new Error(`ArtImage with ID ${id} not found.`)
    }

    // Return the found ArtImage, wrapped in a data object
    return { success: true, data: { artImage } }
  } catch (error) {
    // Handle errors through errorHandler
    return errorHandler(error)
  }
})
