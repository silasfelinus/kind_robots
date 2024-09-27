import type { Prisma, Gallery } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

// Function to create a new gallery
export async function createGallery(
  gallery: Prisma.GalleryCreateInput,
): Promise<Gallery | null> {
  try {
    // Validate required fields
    if (!gallery.name) {
      throw new Error('Name must be provided')
    }

    // Check for duplicate gallery name
    const existingGallery = await prisma.gallery.findUnique({
      where: { name: gallery.name },
    })

    if (existingGallery) {
      console.log(`Gallery with name ${gallery.name} already exists.`)
      return null // Return null if the gallery already exists
    }

    // Create the new Gallery
    return await prisma.gallery.create({
      data: gallery,
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

// Function to update an existing Gallery by ID
export async function updateGallery(
  id: number,
  updatedGallery: Prisma.GalleryUpdateInput,
): Promise<Gallery | null> {
  try {
    return await prisma.gallery.update({
      where: { id },
      data: updatedGallery,
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

// Function to delete a Gallery by ID
export async function deleteGallery(id: number): Promise<boolean> {
  try {
    const galleryExists = await prisma.gallery.findUnique({ where: { id } })

    if (!galleryExists) {
      return false
    }

    await prisma.gallery.delete({ where: { id } })
    return true
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

// Function to fetch all Galleries
export async function fetchGalleries(): Promise<Gallery[]> {
  return await prisma.gallery.findMany()
}

// Function to fetch a single Gallery by ID
export async function fetchGalleryById(id: number): Promise<Gallery | null> {
  return await prisma.gallery.findUnique({
    where: { id },
  })
}

// Function to fetch Galleries by User ID
export async function fetchGalleriesByUserId(
  userId: number,
): Promise<Gallery[]> {
  return await prisma.gallery.findMany({
    where: { userId },
  })
}

function constructImageUrl(galleryName: string, imageName: string): string {
  return `/images/${galleryName}/${imageName}`
}

function getRandomIndex(length: number): number {
  return Math.floor(Math.random() * length)
}

// Function to fetch all Gallery IDs
export async function fetchAllGalleryIds(): Promise<number[]> {
  try {
    const galleries = await prisma.gallery.findMany({
      select: {
        id: true,
      },
    })
    return galleries.map((gallery) => gallery.id)
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

// Function to fetch a random image from a random Gallery
export async function fetchRandomImage(): Promise<string | null> {
  try {
    // First, get the total number of galleries
    const totalGalleries = await prisma.gallery.count()

    // Generate a random index
    const randomIndex = Math.floor(Math.random() * totalGalleries)

    // Fetch a random gallery
    const randomGallery = await prisma.gallery.findFirst({
      skip: randomIndex,
    })

    if (!randomGallery || !randomGallery.imagePaths || !randomGallery.name) {
      return null
    }

    // Split the imagePaths string into an array
    const imagePathsArray = randomGallery.imagePaths.split(',')

    // Pick a random image from the gallery
    const randomImage =
      imagePathsArray[Math.floor(Math.random() * imagePathsArray.length)]

    // Prepend the gallery name and the /images folder to the image path
    const fullImagePath = `/images/${randomGallery.name}/${randomImage}`

    return fullImagePath
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

// Function to fetch all images from all galleries
export async function getAllGalleryImages(): Promise<{
  [galleryId: number]: string[]
}> {
  try {
    const galleries = await prisma.gallery.findMany({
      select: {
        id: true,
        imagePaths: true,
      },
    })

    const allImages: { [galleryId: number]: string[] } = {}

    galleries.forEach((gallery) => {
      if (gallery.imagePaths) {
        allImages[gallery.id] = gallery.imagePaths.split(',')
      }
    })

    return allImages
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

// Function to fetch a gallery by name
export async function fetchGalleryByName(
  name: string,
): Promise<Gallery | null> {
  return prisma.gallery.findUnique({ where: { name } })
}

// Function to get images from a gallery by ID
export async function getGalleryImages(galleryId: number): Promise<string[]> {
  try {
    const gallery = await fetchGalleryById(galleryId)
    if (!gallery) throw new Error(`No gallery found for id: ${galleryId}`)

    if (!gallery.imagePaths) {
      console.warn(`No image paths for gallery: ${gallery.name}`)
      return []
    }

    const imageNames = gallery.imagePaths.split(',')

    return imageNames.map((imageName: string) =>
      constructImageUrl(gallery.name, imageName.trim()),
    )
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

// Function to get a random image from a gallery by ID
export async function getRandomGalleryImage(
  galleryId: number,
): Promise<string | null> {
  try {
    const galleryImages = await getGalleryImages(galleryId)
    return galleryImages[getRandomIndex(galleryImages.length)] || null
  } catch (error: unknown) {
    console.error(`Failed to get random gallery image: ${error}`)
    throw error
  }
}

// Function to get a random image from a gallery by name
export async function getRandomImageByGalleryName(
  galleryName: string,
): Promise<string | null> {
  try {
    const gallery = await fetchGalleryByName(galleryName)
    if (!gallery) throw new Error(`No gallery found with name: ${galleryName}`)

    return getRandomGalleryImage(gallery.id)
  } catch (error: unknown) {
    console.error(
      `Failed to get random image for gallery name ${galleryName}: ${error}`,
    )
    throw error
  }
}

// Function to add multiple galleries
export async function addGalleries(
  galleriesData: Prisma.GalleryCreateManyInput[],
): Promise<{ count: number; galleries: Gallery[]; errors: string[] }> {
  const errors: string[] = []
  const data = galleriesData.filter((galleryData) => {
    if (!galleryData.name) {
      errors.push(`Gallery with ID ${galleryData.id} does not have a name.`)
      return false
    }
    return true
  })

  const result = await prisma.gallery.createMany({
    data,
    skipDuplicates: true,
  })

  const galleries = await fetchGalleries()

  return { count: result.count, galleries, errors }
}

export async function randomGallery(): Promise<Gallery | null> {
  const totalGalleries = await prisma.gallery.count()

  if (totalGalleries === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * totalGalleries)
  return await prisma.gallery.findFirst({
    skip: randomIndex,
  })
}

// Function to count all galleries
export async function countGalleries(): Promise<number> {
  return await prisma.gallery.count()
}

// Export Gallery type
export type { Gallery }
