// /server/api/galleries/batch.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Validate the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Read and validate incoming batch data
    const galleryData = (await readBody(
      event,
    )) as Prisma.GalleryCreateManyInput[]
    if (!Array.isArray(galleryData)) {
      throw createError({
        statusCode: 400,
        message: 'Expected the gallery data to be an array of Gallery objects.',
      })
    }

    // Ensure all galleries are associated with the authenticated user
    const validatedGalleryData = galleryData.map((gallery) => ({
      ...gallery,
      userId, // Enforce user ID from the authenticated token
    }))

    // Batch creation of galleries, with skipDuplicates to avoid duplicates
    const createdCount = await prisma.gallery.createMany({
      data: validatedGalleryData,
      skipDuplicates: true,
    })

    // Fetch created galleries for verification
    const createdGalleries = await prisma.gallery.findMany({
      where: {
        name: { in: validatedGalleryData.map((g) => g.name) },
      },
    })

    // Set status code to 201 Created
    event.node.res.statusCode = 201
    return {
      success: true,
      createdCount,
      createdGalleries,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message: 'Failed to create galleries in batch.',
      error: handledError.message,
      statusCode: handledError.statusCode || 500,
    }
  }
})
