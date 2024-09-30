// server/api/art/collection.post.ts

import { defineEventHandler, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const { userId, artIds } = await readBody(event) // Expect `userId` and optional `artIds`

    // Ensure `userId` is provided
    if (!userId) {
      return { success: false, message: 'Missing userId' }
    }

    // Create a new collection for the user
    const newCollection = await prisma.artCollection.create({
      data: {
        userId,
        art: {
          connect: artIds ? artIds.map((id: number) => ({ id })) : [],
        },
      },
      include: {
        art: true, // Include the connected art entries
      },
    })

    return { success: true, collection: newCollection }
  } catch (error: unknown) {
    return errorHandler(error + 'Failed to create art collection.')
  }
})
