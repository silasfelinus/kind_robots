// server/api/art/collection/[id].patch.ts

import { defineEventHandler, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const collectionId = Number(event.context.params?.id)
    const { action, artId } = await readBody(event) // Expect `action` (add/remove) and `artId`

    // Validate the input
    if (!['add', 'remove'].includes(action) || !artId) {
      return { success: false, message: 'Invalid request parameters' }
    }

    // Fetch the collection to ensure it exists
    const collection = await prisma.artCollection.findUnique({
      where: { id: collectionId },
    })

    if (!collection) {
      return { success: false, message: `Collection with ID ${collectionId} not found.` }
    }

    // Update the collection based on the action (add/remove)
    const updatedCollection = await prisma.artCollection.update({
      where: { id: collectionId },
      data: {
        art: {
          [action === 'add' ? 'connect' : 'disconnect']: { id: artId },
        },
      },
      include: {
        art: true, // Include the updated art entries in the response
      },
    })

    return { success: true, collection: updatedCollection }
  } catch (error: unknown) {
    return errorHandler(error + `Failed to patch art to/from collection.`)
  }
})
