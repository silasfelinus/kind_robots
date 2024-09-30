// server/api/art/collection/[id].delete.ts

import { defineEventHandler } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const collectionId = Number(event.context.params?.id)

    // Ensure the collection exists
    const collection = await prisma.artCollection.findUnique({
      where: { id: collectionId },
    })

    if (!collection) {
      throw new Error(`Collection with ID ${collectionId} not found.`)
    }

    // Delete the collection
    await prisma.artCollection.delete({
      where: { id: collectionId },
    })

    return { success: true, message: `Collection ${collectionId} deleted successfully.` }
  } catch (error: unknown) {
    return errorHandler(error + 'Failed to delete art collection.')
  }
})
