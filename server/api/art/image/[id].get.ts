// server/api/art/image/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)

  try {
    console.log(`[API] Fetching ArtImage with ID: ${id}`)

    // Validate the ID
    if (isNaN(id) || id <= 0) {
      throw new Error('Invalid ID provided.')
    }

    const data = await prisma.artImage.findUnique({
      where: { id },
    })

    if (!data) {
      throw new Error(`ArtImage with ID ${id} not found.`)
    }

    // Return the found ArtImage, wrapped in a data object
    return { success: true, data }
  } catch (error) {
    // Handle errors through errorHandler
    return errorHandler(error)
  }
})
