// server/api/galleries/random/count/[count].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../../utils/prisma'
import { getGalleryImages } from '../..'
import { errorHandler } from '../../../utils/error'

export default defineEventHandler(async (event) => {
  let response

  try {
    const count = Number(event.context.params?.count)

    // Validate the count parameter
    if (isNaN(count) || count <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid count parameter. It must be a positive number.',
      })
    }

    // Fetch gallery IDs with non-null imagePaths
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

    // Shuffle the gallery IDs and initialize the selected images array
    let remainingGalleryIDs = initialGalleryIDs
      .sort(() => 0.5 - Math.random())
      .map((g) => g.id)
    const selectedImages: string[] = []

    // Collect images until reaching the desired count or exhausting available galleries
    while (selectedImages.length < count && remainingGalleryIDs.length > 0) {
      const batchSize = Math.min(
        remainingGalleryIDs.length,
        count - selectedImages.length,
      )
      const selectedBatchIDs = remainingGalleryIDs.slice(0, batchSize)
      remainingGalleryIDs = remainingGalleryIDs.slice(batchSize)

      // Fetch galleries using the selected IDs
      const galleries = await prisma.gallery.findMany({
        where: {
          id: { in: selectedBatchIDs },
        },
      })

      // Fetch and select random images from each gallery
      const allImagesArrays = await Promise.all(
        galleries.map((gallery) => getGalleryImages(gallery.id)),
      )
      allImagesArrays.forEach((galleryImages) => {
        if (galleryImages.length > 0) {
          const randomImage =
            galleryImages[Math.floor(Math.random() * galleryImages.length)]
          selectedImages.push(randomImage)
        }
      })
    }

    // Check if we have the required number of images
    if (selectedImages.length < count) {
      return {
        success: false,
        message: `Could not fetch the required number of random images. Requested: ${count}, Received: ${selectedImages.length}`,
        error: 'Insufficient images',
        statusCode: 206, // Partial content
      }
    }

    // Return a successful response with the selected images
    response = {
      success: true,
      data: { images: selectedImages },
      message: 'Random images retrieved successfully.',
      statusCode: 200,
    }
  } catch (error: unknown) {
    // Use error handler for structured error response
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
