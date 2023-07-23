// ~/server/api/media/index.ts
import { Media as MediaRecord, Prisma } from '@prisma/client'
import prisma from './../utils/prisma'

export type Media = MediaRecord

export async function fetchMedia(page = 1, pageSize = 10): Promise<Media[]> {
  const skip = (page - 1) * pageSize
  return await prisma.media.findMany({
    skip,
    take: pageSize
  })
}

export async function fetchMediaById(id: number): Promise<Media | null> {
  return await prisma.media.findUnique({
    where: { id }
  })
}

export async function addMedia(
  mediaData: Partial<Media>[]
): Promise<{ count: number; media: Media[]; errors: string[] }> {
  const errors: string[] = []
  const data: Prisma.MediaCreateManyInput[] = mediaData
    .filter((item) => {
      if (!item.path) {
        errors.push(`Media with ID ${item.id} does not have a path.`)
        return false
      }
      return true
    })
    .map((item) => item as Prisma.MediaCreateManyInput)

  const result = await prisma.media.createMany({
    data,
    skipDuplicates: true
  })

  const media = await fetchMedia()

  return { count: result.count, media, errors }
}

export async function updateMedia(id: number, data: Partial<Media>): Promise<Media | null> {
  const mediaExists = await prisma.media.findUnique({ where: { id } })

  if (!mediaExists) {
    return null
  }

  return await prisma.media.update({
    where: { id },
    data: data as Prisma.MediaUpdateInput
  })
}

export async function deleteMedia(id: number): Promise<boolean> {
  const mediaExists = await prisma.media.findUnique({ where: { id } })

  if (!mediaExists) {
    return false
  }

  await prisma.media.delete({ where: { id } })
  return true
}

export async function randomMedia(): Promise<Media | null> {
  const totalMedia = await prisma.media.count()

  if (totalMedia === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * totalMedia)
  return await prisma.media.findFirst({
    skip: randomIndex
  })
}
