// ~/types/gallery.ts
import { GalleryRecord as Gallery } from '@prisma/client'
import prisma from '../server/api/utils/prisma'
import { Timestamp } from './utils'
import { Media } from './mediaStore'
// /server/api/utils/gallery.ts
import { ErrorHandler } from './errorStore'
import { randomPhrase } from './random'

export interface GalleryData {
  name?: string
  description?: string
  promoImages?: string
  url?: string
  isNSFW?: boolean
  custodian?: string
  userId?: number
}

export const findGallery = async (id: number): Promise<Gallery> => {
  return ErrorHandler(async () => {
    const gallery = await prisma.gallery.findUnique({ where: { id } })
    if (!gallery) {
      throw new Error('Gallery not found.')
    }
    return gallery
  }, 'Error while finding a gallery')
}

export const createGallery = async (
  galleriesData: Partial<GalleryData>[]
): Promise<{ count: number }> => {
  return ErrorHandler(async () => {
    const data = galleriesData.map((galleryData) => {
      let name = galleryData.name

      if (!name) {
        name = randomPhrase()
      }

      return {
        ...galleryData,
        name: name!
      } as Omit<Gallery, 'id' | 'createdAt' | 'updatedAt' | 'Images' | 'User'>
    })

    const result = await prisma.gallery.createMany({
      data,
      skipDuplicates: true
    })

    return { count: result.count }
  }, 'Error while creating galleries')
}

export const updateGallery = async (
  id: number,
  data: Partial<Omit<Gallery, 'id' | 'createdAt' | 'updatedAt' | 'Images' | 'User'>>
): Promise<Gallery> => {
  return ErrorHandler(async () => {
    return await prisma.gallery.update({
      where: { id },
      data
    })
  }, 'Error while updating a gallery')
}

export const deleteGallery = async (id: number): Promise<Gallery> => {
  return ErrorHandler(async () => {
    return await prisma.gallery.delete({ where: { id } })
  }, 'Error while deleting a gallery')
}

export const randomGallery = async (): Promise<Gallery> => {
  return ErrorHandler(async () => {
    const totalGalleries = await prisma.gallery.count()
    const randomIndex = Math.floor(Math.random() * totalGalleries)
    const randomGallery = await prisma.gallery.findFirst({
      skip: randomIndex
    })

    if (!randomGallery) {
      throw new Error('Gallery not found.')
    }

    return randomGallery
  }, 'Error while finding a random gallery')
}

export const getGalleries = async (): Promise<Gallery[]> => {
  return ErrorHandler(async () => {
    return await prisma.gallery.findMany()
  }, 'Error while retrieving galleries')
}

export const countGalleries = async (): Promise<number> => {
  return ErrorHandler(async () => {
    return await prisma.gallery.count()
  }, 'Error while counting galleries')
}

export interface Gallery {
  id: number
  createdAt: Timestamp
  updatedAt: Timestamp
  name: string
  Media: Media[]
  description?: string
  promoImages?: string
  url?: string
  isNSFW: boolean
  custodian?: string
  userId?: number
}
