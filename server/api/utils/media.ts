// /server/api/utils/media.ts
import { Media } from '../../../types/media'
import prisma from './prisma'
import { ErrorHandler } from './error'

export interface MediaData {
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

export const createMedia = async (mediaData: MediaData): Promise<Media> => {
  return await ErrorHandler(async () => {
    return await prisma.media.create({
      data: mediaData
    })
  }, 'Error while creating an media')
}

export const createManyMedias = async (
  mediasData: Partial<MediaData>[]
): Promise<{ count: number }> => {
  return await ErrorHandler(async () => {
    const result = await prisma.media.createMany({
      data: mediasData,
      skipDuplicates: true // or false, depending on your requirements
    })

    return { count: result.count }
  }, 'Error while creating multiple medias')
}

export const findMediaById = async (id: number): Promise<Media | null> => {
  return ErrorHandler(async () => {
    return await prisma.media.findUnique({
      where: { id }
    })
  }, 'Error while finding media by id')
}

export const updateMedia = async (
  id: number,
  data: Partial<Omit<Media, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Media> => {
  return ErrorHandler(async () => {
    return await prisma.media.update({
      where: { id },
      data
    })
  }, 'Error while updating media')
}

export const deleteMedia = async (id: number): Promise<Media> => {
  return ErrorHandler(async () => {
    return await prisma.media.delete({
      where: { id }
    })
  }, 'Error while deleting media')
}

export const findMediasByUserId = async (userId: number): Promise<Media[]> => {
  return ErrorHandler(async () => {
    return await prisma.media.findMany({
      where: { userId }
    })
  }, 'Error while finding medias by user id')
}

export const findMediasByGalleryId = async (galleryId: number): Promise<Media[]> => {
  return ErrorHandler(async () => {
    return await prisma.media.findMany({
      where: { galleryId }
    })
  }, 'Error while finding medias by gallery id')
}

export const findMediasByBotId = async (botId: number): Promise<Media[]> => {
  return ErrorHandler(async () => {
    return await prisma.media.findMany({
      where: { botId }
    })
  }, 'Error while finding medias by bot id')
}

export const findMediasByDesigner = async (designer: string): Promise<Media[]> => {
  return ErrorHandler(async () => {
    return await prisma.media.findMany({
      where: { designer }
    })
  }, 'Error while finding medias by designer')
}

export const findMediasByNSFW = async (isNSFW: boolean): Promise<Media[]> => {
  return ErrorHandler(async () => {
    return await prisma.media.findMany({
      where: { isNSFW }
    })
  }, 'Error while finding NSFW medias')
}

export const randomMedia = async (): Promise<Media> => {
  return ErrorHandler(async () => {
    const totalMedias = await prisma.media.count()
    const randomIndex = Math.floor(Math.random() * totalMedias)
    const randomMedia = await prisma.media.findFirst({
      skip: randomIndex
    })

    if (!randomMedia) {
      throw new Error('Media not found.')
    }

    return randomMedia
  }, 'Error while finding random media')
}
