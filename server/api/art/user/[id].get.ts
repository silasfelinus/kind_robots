// server/api/art/user/[id].get.ts

import { defineEventHandler } from 'h3'
import type { Art } from '@prisma/client'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const userId = Number(event.context.params?.id)  // Ensure the userId is correctly parsed from the URL parameter
    const userArt = await fetchArtByUserId(userId)
    return { success: true, art: userArt }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to fetch Art entries by User ID
export async function fetchArtByUserId(userId: number): Promise<Art[]> {
  return await prisma.art.findMany({
    where: { userId },
    orderBy: {
      createdAt: 'desc'  // Optionally order by most recent first
    }
  })
}
