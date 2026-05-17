// /server/api/art/collection/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'

export default defineEventHandler(async () => {
  try {
    const data = await prisma.artCollection.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        art: {
          orderBy: {
            id: 'desc',
          },
        },
        ArtImages: {
          orderBy: {
            id: 'desc',
          },
        },
      },
    })

    return {
      success: true,
      data,
      message: data.length
        ? 'Art collections loaded.'
        : 'No art collections found.',
    }
  } catch (error) {
    return errorHandler(error)
  }
})
