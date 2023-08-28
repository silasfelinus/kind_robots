import { Gallery as GalleryRecord, Prisma } from '@prisma/client'
import prisma from './../utils/prisma'

export type Gallery = GalleryRecord

function constructImageUrl(galleryName: string, imageName: string): string {
  return `/images/${galleryName}/${imageName}`
}

function getRandomIndex(length: number): number {
  return Math.floor(Math.random() * length)
}

export async function fetchGalleries(page = 1, pageSize = 100): Promise<Gallery[]> {
  const skip = (page - 1) * pageSize
  return prisma.gallery.findMany({ skip, take: pageSize })
}
export async function getRandomImage(): Promise<string | null> {
  try {
    // Fetch all images from all galleries
    const allImages = await getAllGalleryImages()

    if (allImages.length === 0) {
      return null
    }

    // Randomly pick an image
    const randomImage = allImages[getRandomIndex(allImages.length)]

    return randomImage
  } catch (error) {
    console.error(`Failed to get a random image: ${error}`)
    throw error
  }
}

export async function fetchGalleryById(id: number): Promise<Gallery | null> {
  return prisma.gallery.findUnique({ where: { id } })
}

export async function fetchGalleryByName(name: string): Promise<Gallery | null> {
  return prisma.gallery.findUnique({ where: { name } })
}

export async function getGalleryImages(galleryId: number): Promise<string[]> {
  try {
    const gallery = await fetchGalleryById(galleryId)
    if (!gallery) throw new Error(`No gallery found for id: ${galleryId}`)

    if (!gallery.imagePaths) {
      console.warn(`No image paths for gallery: ${gallery.name}`)
      return []
    }

    const imageNames = gallery.imagePaths.split(',')

    return imageNames.map((imageName: string) => constructImageUrl(gallery.name, imageName.trim()))
  } catch (error) {
    console.error(`Failed to get gallery images: ${error}`)
    throw error
  }
}

export async function getRandomGalleryImage(galleryId: number): Promise<string | null> {
  try {
    const galleryImages = await getGalleryImages(galleryId)
    return galleryImages[getRandomIndex(galleryImages.length)]
  } catch (error) {
    console.error(`Failed to get random gallery image: ${error}`)
    throw error
  }
}

export async function getRandomImageByGalleryName(galleryName: string): Promise<string | null> {
  try {
    const gallery = await fetchGalleryByName(galleryName)
    if (!gallery) throw new Error(`No gallery found with name: ${galleryName}`)

    return getRandomGalleryImage(gallery.id)
  } catch (error) {
    console.error(`Failed to get random image for gallery name ${galleryName}: ${error}`)
    throw error
  }
}

export async function addGalleries(
  galleriesData: Partial<Gallery>[]
): Promise<{ count: number; galleries: Gallery[]; errors: string[] }> {
  const errors: string[] = []
  const data: Prisma.GalleryCreateManyInput[] = galleriesData
    .filter((galleryData) => {
      if (!galleryData.name) {
        errors.push(`Gallery with ID ${galleryData.id} does not have a name.`)
        return false
      }
      return true
    })
    .map((galleryData) => galleryData as Prisma.GalleryCreateManyInput)

  const result = await prisma.gallery.createMany({
    data,
    skipDuplicates: true
  })

  const galleries = await fetchGalleries()

  return { count: result.count, galleries, errors }
}

export async function updateGallery(id: number, data: Partial<Gallery>): Promise<Gallery | null> {
  const galleryExists = await prisma.gallery.findUnique({ where: { id } })

  if (!galleryExists) {
    return null
  }

  return await prisma.gallery.update({
    where: { id },
    data: data as Prisma.GalleryUpdateInput
  })
}
export async function getAllGalleryImages(): Promise<string[]> {
  try {
    const galleries = await prisma.gallery.findMany()
    const imagesPromises = galleries.map((gallery) => getGalleryImages(gallery.id))
    const allImagesArrays = await Promise.all(imagesPromises)
    return allImagesArrays.flat()
  } catch (error) {
    console.error(`Failed to get all gallery images: ${error}`)
    throw error
  }
}

export async function deleteGallery(id: number): Promise<boolean> {
  const galleryExists = await prisma.gallery.findUnique({ where: { id } })

  if (!galleryExists) {
    return false
  }

  await prisma.gallery.delete({ where: { id } })
  return true
}

export async function randomGallery(): Promise<Gallery | null> {
  const totalGalleries = await prisma.gallery.count()

  if (totalGalleries === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * totalGalleries)
  return await prisma.gallery.findFirst({
    skip: randomIndex
  })
}

export async function countGalleries(): Promise<number> {
  return await prisma.gallery.count()
}
