// server/api/art/collection/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const collectionId = Number(event.context.params?.id)
    const { artIds } = await readBody(event)  // Expect artIds as an array of art IDs

    // Validate the input
    if (!artIds || !Array.isArray(artIds) || artIds.length === 0) {
      return { success: false, message: 'Invalid or missing art IDs.', statusCode: 400 }
    }

    // Fetch the collection to ensure it exists
    const collection = await prisma.artCollection.findUnique({
      where: { id: collectionId },
      include: { art: true },
    })

    if (!collection) {
      return { success: false, message: `Collection with ID ${collectionId} not found.`, statusCode: 404 }
    }

    // Validate that all artIds exist in the Art table
    const artList = await prisma.art.findMany({
      where: { id: { in: artIds } }
    })

    if (artList.length !== artIds.length) {
      return { success: false, message: 'One or more art IDs do not exist.', statusCode: 404 }
    }

    // Update the collection by connecting the new art pieces
    const updatedCollection = await prisma.artCollection.update({
      where: { id: collectionId },
      data: {
        art: {
          set: artList.map(art => ({ id: art.id }))  // Set the new art pieces in the collection
        }
      },
      include: { art: true }  // Include the updated art entries
    })

    return { success: true, collection: updatedCollection }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
