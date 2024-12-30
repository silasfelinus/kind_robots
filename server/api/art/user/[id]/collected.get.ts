// server/api/art/user/[id]/collected.get.ts

import { defineEventHandler } from 'h3'
import type { Art } from '@prisma/client'
import { errorHandler } from '../../../utils/error'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const userId = Number(event.context.params?.id)

    if (isNaN(userId)) {
      event.node.res.statusCode = 400
      throw new Error('Invalid user ID')
    }

    // Fetch the user's collected art via their collections
    const collectedArt = await fetchUserCollectedArt(userId)

    // Wrap the collected art in a data object
    return { success: true, data: { collectedArt } }
  } catch (error: unknown) {
    return errorHandler(`Failed to fetch collected art for user ${event.context.params?.id}`)
  }
})

// Function to fetch collected art via ArtCollection by User ID
async function fetchUserCollectedArt(userId: number): Promise<Art[]> {
  const collections = await prisma.artCollection.findMany({
    where: {
      userId, // Filter collections by the userId
    },
    include: {
      art: true, // Explicitly include related Art objects
    },
    orderBy: {
      createdAt: 'desc', // Optionally order collections by most recent
    },
  })

  // Flatten the collected art from the collections into a single array
  return collections.flatMap((collection) => collection.art)
}
