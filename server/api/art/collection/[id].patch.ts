// server/api/art/collection/[id].patch.ts

import { defineEventHandler, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const collectionId = Number(event.context.params?.id)
    const { action, artId } = await readBody(event)  // Expect action (add/remove/removeAll) and optional artId

    // Validate the input
    if (!['add', 'remove', 'removeAll'].includes(action) || (action !== 'removeAll' && !artId)) {
      return { success: false, message: 'Invalid request parameters', statusCode: 400 }
    }

    // Fetch the collection to ensure it exists
    const collection = await prisma.artCollection.findUnique({
      where: { id: collectionId },
      include: {
        art: true,
      },
    })

    if (!collection) {
      return { success: false, message: `Collection with ID ${collectionId} not found.`, statusCode: 404 }
    }

    // Handle the different actions
    let updatedCollection;

    if (action === 'add') {
      // Add a single art entry to the collection
      updatedCollection = await prisma.artCollection.update({
        where: { id: collectionId },
        data: {
          art: {
            connect: { id: artId },  // Connect art with the given artId
          },
        },
        include: {
          art: true,
        },
      })
    } else if (action === 'remove') {
      // Remove a single art entry from the collection
      updatedCollection = await prisma.artCollection.update({
        where: { id: collectionId },
        data: {
          art: {
            disconnect: { id: artId },  // Disconnect the specified artId
          },
        },
        include: {
          art: true,
        },
      })
    } else if (action === 'removeAll') {
      // Remove all art from the collection
      updatedCollection = await prisma.artCollection.update({
        where: { id: collectionId },
        data: {
          art: {
            set: [],  // Disconnect all art from the collection
          },
        },
        include: {
          art: true,
        },
      })
    }

    return { success: true, collection: updatedCollection }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
