// ~/server/api/galleries/index.ts
import fs from 'fs'
import path from 'path'
import { Gallery as GalleryRecord, Prisma } from '@prisma/client'
import prisma from './../utils/prisma'

export type Gallery = GalleryRecord

export async function getGalleryImages(galleryId: number) {
  try {
    const gallery = await fetchGalleryById(galleryId)
    if (!gallery) {
      throw new Error(`No gallery found for id: ${galleryId}`)
    }

    const galleryName = gallery.name
    const imagesFilePath = path.resolve(__dirname, `../../public/images/${galleryName}/images.json`)
    const imagesFile = fs.readFileSync(imagesFilePath, 'utf8')
    const images = JSON.parse(imagesFile)

    return images.map((image: string) => `/images/${galleryName}/${image}`)
  } catch (error) {
    console.error(`Failed to get gallery images: ${error}`)
    throw error
  }
}

export async function getRandomGalleryImage(galleryId: number) {
  try {
    const galleryImages = await getGalleryImages(galleryId)
    const randomIndex = Math.floor(Math.random() * galleryImages.length)
    return galleryImages[randomIndex]
  } catch (error) {
    console.error(`Failed to get random gallery image: ${error}`)
    throw error
  }
}

export async function fetchGalleries(page = 1, pageSize = 100): Promise<Gallery[]> {
  const skip = (page - 1) * pageSize
  return await prisma.gallery.findMany({
    skip,
    take: pageSize
  })
}

export async function fetchGalleryById(id: number): Promise<Gallery | null> {
  return await prisma.gallery.findUnique({
    where: { id }
  })
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
export async function getAllGalleryImages() {
  try {
    const galleries = await prisma.gallery.findMany()
    let allImages: string[] = []

    for (const gallery of galleries) {
      const images = await getGalleryImages(gallery.id)
      allImages = [...allImages, ...images]
    }

    return allImages
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
