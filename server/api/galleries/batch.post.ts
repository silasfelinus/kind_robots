// /server/api/galleries/batch.post.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
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

    // Perform batch creation, skipping duplicates
    const createdCount = await prisma.gallery.createMany({
      data: galleryData,
      skipDuplicates: true,
    })

    // Retrieve created galleries for verification
    const createdGalleries = await prisma.gallery.findMany({
      where: {
        name: { in: galleryData.map((g) => g.name) },
      },
    })

    return {
      success: true,
      createdCount,
      createdGalleries,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message: 'Failed to create galleries in batch.',
      error: handledError.message,
      statusCode: handledError.statusCode || 500,
    }
  }
})
