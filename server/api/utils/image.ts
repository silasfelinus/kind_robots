// /server/api/utils/image.ts
import { Image } from '@prisma/client'
import prisma from './prisma'
import { ErrorHandler } from './error'

export interface ImageData {
  path: string
  isNSFW?: boolean
  isFavorite?: boolean
  isFlagged?: boolean
  tags?: string
  designer?: string
  exifDataId?: number
  userId?: number
  galleryId?: number
  botId?: number
}

export const createImage = async (imageData: ImageData): Promise<Image> => {
  return await ErrorHandler(async () => {
    return await prisma.image.create({
      data: imageData
    })
  }, 'Error while creating an image')
}

export const createManyImages = async (
  imagesData: Partial<ImageData>[]
): Promise<{ count: number }> => {
  return await ErrorHandler(async () => {
    const result = await prisma.image.createMany({
      data: imagesData,
      skipDuplicates: true // or false, depending on your requirements
    })

    return { count: result.count }
  }, 'Error while creating multiple images')
}

export const findImageById = async (id: number): Promise<Image | null> => {
  return ErrorHandler(async () => {
    return await prisma.image.findUnique({
      where: { id }
    })
  }, 'Error while finding image by id')
}

export const updateImage = async (
  id: number,
  data: Partial<Omit<Image, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Image> => {
  return ErrorHandler(async () => {
    return await prisma.image.update({
      where: { id },
      data
    })
  }, 'Error while updating image')
}

export const deleteImage = async (id: number): Promise<Image> => {
  return ErrorHandler(async () => {
    return await prisma.image.delete({
      where: { id }
    })
  }, 'Error while deleting image')
}

export const findImagesByUserId = async (userId: number): Promise<Image[]> => {
  return ErrorHandler(async () => {
    return await prisma.image.findMany({
      where: { userId }
    })
  }, 'Error while finding images by user id')
}

export const findImagesByGalleryId = async (galleryId: number): Promise<Image[]> => {
  return ErrorHandler(async () => {
    return await prisma.image.findMany({
      where: { galleryId }
    })
  }, 'Error while finding images by gallery id')
}

export const findImagesByBotId = async (botId: number): Promise<Image[]> => {
  return ErrorHandler(async () => {
    return await prisma.image.findMany({
      where: { botId }
    })
  }, 'Error while finding images by bot id')
}

export const findImagesByDesigner = async (designer: string): Promise<Image[]> => {
  return ErrorHandler(async () => {
    return await prisma.image.findMany({
      where: { designer }
    })
  }, 'Error while finding images by designer')
}

export const findImagesByNSFW = async (isNSFW: boolean): Promise<Image[]> => {
  return ErrorHandler(async () => {
    return await prisma.image.findMany({
      where: { isNSFW }
    })
  }, 'Error while finding NSFW images')
}

export const randomImage = async (): Promise<Image> => {
  return ErrorHandler(async () => {
    const totalImages = await prisma.image.count()
    const randomIndex = Math.floor(Math.random() * totalImages)
    const randomImage = await prisma.image.findFirst({
      skip: randomIndex
    })

    if (!randomImage) {
      throw new Error('Image not found.')
    }

    return randomImage
  }, 'Error while finding random image')
}
