// server/api/art/collection/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const collectionId = Number(event.context.params?.id)

    const collection = await prisma.artCollection.findUnique({
      where: { id: collectionId },
      include: {
        art: true,
      },
    })

    if (!collection) {
      throw new Error(`Collection with ID ${collectionId} not found.`)
    }

    // Wrap the collection in a data object for consistent response format
    return { success: true, data: { collection } }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
