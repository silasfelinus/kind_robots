// server/api/random/count/count.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../../utils/prisma'
import { getGalleryImages } from '../..'

interface ImageResponse {
  success: boolean
  images?: string[]
  message?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<ImageResponse> => {
  try {
    const count = Number(event.context.params?.count)

    // Validate the count parameter
    if (isNaN(count) || count <= 0) {
      return {
        success: false,
        message: 'Invalid count parameter. It must be a positive number.',
        error: 'Invalid count',
      }
    }

    // Fetch gallery IDs with imagePaths
    const initialGalleryIDs = await prisma.gallery.findMany({
      where: {
        imagePaths: {
          not: null, // Only include galleries with imagePaths
        },
      },
      select: { id: true },
    })

    if (initialGalleryIDs.length === 0) {
      return {
        success: false,
        message: 'No galleries found with imagePaths.',
        error: 'No galleries',
      }
    }

    // Shuffle the array of gallery IDs
    const shuffledIDs = initialGalleryIDs.sort(() => 0.5 - Math.random())

    // Select the required number of gallery IDs
    const selectedGalleryIDs = shuffledIDs
      .slice(0, Math.min(count, shuffledIDs.length))
      .map((g) => g.id)

    // Fetch galleries using the selected IDs
    const galleries = await prisma.gallery.findMany({
      where: {
        id: { in: selectedGalleryIDs },
      },
    })

    // Extract images from each gallery
    const imagesPromises = galleries.map((gallery) =>
      getGalleryImages(gallery.id),
    )
    const allImagesArrays = await Promise.all(imagesPromises)

    // Extract one image path from each gallery
    const selectedImages = allImagesArrays.flatMap((galleryImages) => {
      return galleryImages.length > 0
        ? galleryImages[Math.floor(Math.random() * galleryImages.length)]
        : []
    })

    if (selectedImages.length < count) {
      return {
        success: false,
        message: 'Could not fetch the required number of random images.',
        error: 'Insufficient images',
      }
    }

    return { success: true, images: selectedImages }
  } catch (error: unknown) {
    return {
      success: false,
      message: 'Failed to fetch random images.',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})
