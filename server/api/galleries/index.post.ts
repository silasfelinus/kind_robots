// /server/api/galleries/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Prisma, Gallery } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Read and validate single gallery data
    const galleryData = (await readBody(event)) as Prisma.GalleryCreateInput
    if (!galleryData || typeof galleryData.name !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'Invalid data. Gallery name is required.',
      })
    }

    // Create the gallery entry
    const newGallery: Gallery = await prisma.gallery.create({
      data: galleryData,
    })

    return {
      success: true,
      newGallery,
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message: 'Failed to create gallery entry.',
      error: handledError.message,
      statusCode: handledError.statusCode || 500,
    }
  }
})
