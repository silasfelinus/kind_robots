// server/api/art/collection/[id].patch.ts

import { defineEventHandler, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const collectionId = Number(event.context.params?.id)
    const { action, artId } = await readBody(event)

    if (!['add', 'remove'].includes(action) || !artId) {
      return { success: false, message: 'Invalid request parameters' }
    }

    const collection = await prisma.artCollection.findUnique({
      where: { id: collectionId },
    })

    if (!collection) {
      return { success: false, message: `Collection with ID ${collectionId} not found.` }
    }

    const updatedCollection = await prisma.artCollection.update({
      where: { id: collectionId },
      data: {
        art: {
          [action === 'add' ? 'connect' : 'disconnect']: { id: artId },
        },
      },
      include: {
        art: true,
      },
    })

    return { success: true, collection: updatedCollection }
  } catch (error: unknown) {
    return errorHandler(error) // 
  }
})
