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

    if (isNaN(count) || count <= 0) {
      throw new Error('Invalid count parameter.')
    }
    const initialGalleryIDs = await prisma.gallery.findMany({
      where: {
        id: {
          lt: 20, // only including galleries with imagePaths
        },
      },
      select: { id: true },
    })

    // Shuffle the array of gallery IDs
    const shuffledIDs = initialGalleryIDs.sort(() => 0.5 - Math.random())

    // Take the first 'count' shuffled gallery IDs
    const selectedGalleryIDs = shuffledIDs.slice(0, count).map(g => g.id)

    // Fetch 'count' number of galleries using the shuffled gallery IDs
    const galleries = await prisma.gallery.findMany({
      where: {
        id: { in: selectedGalleryIDs },
      },
    })

    // Extract images from each gallery using your method
    const imagesPromises = galleries.map(gallery => getGalleryImages(gallery.id))
    const allImagesArrays = await Promise.all(imagesPromises)

    // Extract one image path from each gallery
    const selectedImages = allImagesArrays.map((galleryImages) => {
      return galleryImages[Math.floor(Math.random() * galleryImages.length)]
    })

    if (selectedImages.length !== count) {
      throw new Error('Could not fetch the required number of random images.')
    }

    return { success: true, images: selectedImages }
  }
  catch (error: any) {
    return {
      success: false,
      message: 'Failed to fetch random images.',
      error: error.message,
    }
  }
})
