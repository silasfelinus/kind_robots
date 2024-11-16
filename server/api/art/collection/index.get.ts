// server/api/art/collection/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'

export default defineEventHandler(async () => {
  try {
    const data = await prisma.artCollection.findMany({
      include: {
        art: true,
      },
    })

    if (!data || data.length === 0) {
      return {
        success: false,
        message: 'No art collections found.',
      }
    }

    // Wrap collections in a data object for consistent response format
    return { success: true, data }
  } catch (error) {
    return errorHandler(error)
  }
})
