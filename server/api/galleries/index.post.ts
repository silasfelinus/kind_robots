// /server/api/galleries/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import type { Prisma, Gallery } from '@prisma/client'

type GalleryResponse = {
  success: boolean
  message?: string
  data?: Gallery
  statusCode?: number
}

export default defineEventHandler(async (event): Promise<GalleryResponse> => {
  let response: GalleryResponse

  try {
    // Validate the API key using the utility function
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Read and validate the gallery data from the request body
    const galleryData = await readBody(event)

    // Check for required fields
    const requiredFields = ['name', 'content']
    const missingFields = requiredFields.filter(
      (field) => !galleryData[field as keyof typeof galleryData],
    )
    if (missingFields.length > 0) {
      throw createError({
        statusCode: 400,
        message: `Missing required fields: ${missingFields.join(', ')}.`,
      })
    }

    // Prepare input data with the authenticated user connected
    const galleryInput: Prisma.GalleryCreateInput = {
      name: galleryData.name,
      content: galleryData.content,
      description: galleryData.description || null,
      highlightImage: galleryData.highlightImage || null,
      url: galleryData.url || null,
      custodian: galleryData.custodian || null,
      imagePaths: galleryData.imagePaths || null,
      isMature: galleryData.isMature ?? false,
      isPublic: galleryData.isPublic ?? true,
      User: { connect: { id: userId } },
      ...(galleryData.Channel?.connect?.id && {
        Channel: { connect: { id: galleryData.Channel.connect.id } },
      }),
    }

    // Create the gallery entry
    const newGallery = await prisma.gallery.create({ data: galleryInput })

    // Successful creation response
    response = {
      success: true,
      data: newGallery,
      message: 'Gallery created successfully.',
      statusCode: 201,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    response = {
      success: false,
      message: handledError.message || 'Failed to create gallery entry.',
      data: undefined, // Ensure `data` is undefined in case of error
      statusCode: handledError.statusCode || 500,
    }
  }

  // Set the status code in the response object
  event.node.res.statusCode = response.statusCode || 500
  return response
})
