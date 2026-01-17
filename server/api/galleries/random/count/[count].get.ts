// server/api/galleries/random/count/[count].get.ts
import { defineEventHandler, createError } from 'h3'
import type { Gallery } from '~/prisma/generated/prisma/client'
import prisma from '../../../../utils/prisma'
import { getGalleryImages } from '../..'
import { errorHandler } from '../../../../utils/error'

export default defineEventHandler(async (event) => {
  let response

  try {
    const count = Number(event.context.params?.count)

    if (Number.isNaN(count) || count <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid count parameter. It must be a positive number.',
      })
    }

    const initialGalleryIDs = await prisma.gallery.findMany({
      where: {
        imagePaths: {
          not: null,
        },
      },
      select: { id: true },
    })

    if (initialGalleryIDs.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'No galleries found with imagePaths.',
      })
    }

    let remainingGalleryIDs: number[] = initialGalleryIDs
      .sort(() => 0.5 - Math.random())
      .map((g: { id: number }) => g.id)

    const data: string[] = []

    while (data.length < count && remainingGalleryIDs.length > 0) {
      const batchSize = Math.min(
        remainingGalleryIDs.length,
        count - data.length,
      )
      const selectedBatchIDs: number[] = remainingGalleryIDs.slice(0, batchSize)
      remainingGalleryIDs = remainingGalleryIDs.slice(batchSize)

      const galleries: Gallery[] = await prisma.gallery.findMany({
        where: {
          id: { in: selectedBatchIDs },
        },
      })

      const allImagesArrays: string[][] = await Promise.all(
        galleries.map((gallery: Gallery) => getGalleryImages(gallery.id)),
      )

      allImagesArrays.forEach((galleryImages: string[]) => {
        if (galleryImages.length > 0) {
          const randomImage =
            galleryImages[Math.floor(Math.random() * galleryImages.length)]
          if (randomImage) data.push(randomImage)
        }
      })
    }

    if (data.length < count) {
      return {
        success: false,
        message: `Could not fetch the required number of random images. Requested: ${count}, Received: ${data.length}`,
        error: 'Insufficient images',
        statusCode: 206,
      }
    }

    response = {
      success: true,
      data,
      message: 'Random images retrieved successfully.',
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error fetching random images:', handledError)
    response = {
      success: false,
      message: handledError.message || 'Failed to fetch random images.',
      statusCode: handledError.statusCode || 500,
    }
  }

  return response
})
