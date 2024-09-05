// /server/api/galleries/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { PrismaClient } from '@prisma/client'
import { errorHandler } from '../utils/error'
import type { Prisma, Gallery } from '@prisma/client'

const prisma = new PrismaClient()

type GalleryItem = {
  name: string
  content?: string
  description?: string
  url?: string | null
  isMature?: boolean
  custodian?: string | null
  userId?: number | null
  highlightImage?: string | null
  imagePaths?: string | null
}

type GalleryData = GalleryItem[]

export default defineEventHandler(async (event) => {
  try {
    const galleryData: GalleryData = await readBody(event)

    if (!Array.isArray(galleryData)) {
      return {
        success: false,
        message: 'Expected the gallery data to be an array.',
        error: 'Invalid data format',
        statusCode: 400,
      }
    }

    const formattedData: Prisma.GalleryCreateManyInput[] = galleryData.map(
      (item) => ({
        name: item.name,
        content: item.content || '',
        description: item.description || null,
        url: item.url || null,
        isMature: item.isMature || false,
        custodian: item.custodian || null,
        userId: item.userId !== undefined ? item.userId : null,
        highlightImage: item.highlightImage || null,
        imagePaths: item.imagePaths || null,
      }),
    )

    // Prefix unused variable to comply with ESLint rules
    const _createdGalleries = await prisma.gallery.createMany({
      data: formattedData,
      skipDuplicates: true,
    })

    const newGalleries: Gallery[] = await prisma.gallery.findMany({
      where: {
        name: {
          in: galleryData.map((g) => g.name),
        },
      },
    })

    return { success: true, newGalleries }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message: 'Failed to create new galleries.',
      error: handledError.message,
      statusCode: handledError.statusCode || 500,
    }
  }
})
