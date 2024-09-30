// server/api/art/collection.post.ts

import { defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const { userId, artIds } = await readBody(event) // Expect userId and optional artIds to be passed

    // Ensure valid userId
    if (!userId) {
      throw new Error('Missing userId')
    }

    // Create a new collection, with optional art entries
    const newCollection = await prisma.artCollection.create({
      data: {
        userId,
        art: {
          connect: artIds ? artIds.map((id: number) => ({ id })) : [],
        },
      },
      include: {
        art: true,
      },
    })

    return { success: true, collection: newCollection }
  } catch (error: unknown) {
    return errorHandler(error +  'Failed to create art collection.')
  }
})
