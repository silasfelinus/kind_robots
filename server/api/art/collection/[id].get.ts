// server/api/art/collection/[id].get.ts

import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const collectionId = Number(event.context.params?.id)

    // Fetch the collection by id
    const collection = await prisma.artCollection.findUnique({
      where: { id: collectionId },
      include: {
        art: true,
      },
    })

    if (!collection) {
      throw new Error(`Collection with ID ${collectionId} not found.`)
    }

    return { success: true, collection }
  } catch (error: unknown) {
    return errorHandler(error + 'Failed to fetch art collection.')
  }
})