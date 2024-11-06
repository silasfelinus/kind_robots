// /server/api/galleries/batch.post.ts
import {
  defineEventHandler,
  readBody,
  createError,
  setResponseStatus,
} from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Prisma, Gallery } from '@prisma/client'

type BatchCreateResponse = {
  success: boolean
  message?: string
  createdCount?: number
  createdGalleries?: Gallery[]
  errors?: string[]
  statusCode?: number
}

export default defineEventHandler(
  async (event): Promise<BatchCreateResponse> => {
    let response: BatchCreateResponse
    try {
      // Validate the authorization token
      const authorizationHeader = event.node.req.headers['authorization']
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        throw createError({
          statusCode: 401,
          message:
            'Authorization token is required in the format "Bearer <token>".',
        })
      }

      const token = authorizationHeader.split(' ')[1]
      const user = await prisma.user.findFirst({
        where: { apiKey: token },
        select: { id: true },
      })

      if (!user) {
        throw createError({
          statusCode: 401,
          message: 'Invalid or expired token.',
        })
      }

      const userId = user.id

      // Read and validate incoming batch data
      const galleryData = (await readBody(
        event,
      )) as Prisma.GalleryCreateManyInput[]
      if (!Array.isArray(galleryData)) {
        throw createError({
          statusCode: 400,
          message:
            'Expected the gallery data to be an array of Gallery objects.',
        })
      }

      // Ensure all galleries are associated with the authenticated user
      const validatedGalleryData = galleryData.map((gallery) => ({
        ...gallery,
        userId, // Enforce user ID from the authenticated token
      }))

      // Batch creation of galleries, with skipDuplicates to avoid duplicates
      const createResult = await prisma.gallery.createMany({
        data: validatedGalleryData,
        skipDuplicates: true,
      })

      // Extract created count and handle any undefined cases
      const createdCount = createResult?.count ?? 0

      // Fetch created galleries for verification
      const createdGalleries = await prisma.gallery.findMany({
        where: {
          name: { in: validatedGalleryData.map((g) => g.name) },
        },
      })

      // Set success response
      response = {
        success: true,
        message: `Successfully created ${createdCount} galleries.`,
        createdCount,
        createdGalleries,
        statusCode: 201, // Created
      }
      setResponseStatus(event, 201)
    } catch (error) {
      const handledError = errorHandler(error)
      response = {
        success: false,
        message: 'Failed to create galleries in batch.',
        errors: [handledError.message], // Changed to `errors` array for consistency
        statusCode: handledError.statusCode || 500,
      }
      setResponseStatus(event, response.statusCode)
    }

    return response
  },
)
