// /server/api/galleries/name/[name].post.ts
import type { H3Event } from 'h3'
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import type { Gallery } from '@prisma/client'

export default defineEventHandler(async (event: H3Event) => {
  let response

  try {
    // Use the utility function to validate the API key
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Extract and validate name from the URL path
    const name = String(event.context.params?.name).trim()
    if (!name) {
      throw createError({
        statusCode: 400,
        message: 'Gallery name is required in the URL path.',
      })
    }

    // Read and validate gallery data from the request body
    const galleryData: Partial<Gallery> = await readBody(event)
    if (!galleryData.content) {
      throw createError({
        statusCode: 400,
        message: 'The "content" field is required for creating a gallery item.',
      })
    }

    // Create the gallery entry, associating it with the authenticated user
    const newGallery = await prisma.gallery.create({
      data: {
        name,
        content: galleryData.content,
        description: galleryData.description ?? null,
        url: galleryData.url ?? null,
        custodian: galleryData.custodian ?? null,
        userId,
        highlightImage: galleryData.highlightImage ?? null,
        imagePaths: galleryData.imagePaths ?? null,
        isMature: galleryData.isMature ?? false,
        channelId: galleryData.channelId ?? null,
      },
    })

    // Return a success response
    event.node.res.statusCode = 201
    response = {
      success: true,
      message: `Gallery '${name}' created successfully.`,
      data: { gallery: newGallery },
      statusCode: 201,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    console.error('Error creating gallery:', handledError)

    // Handle the error with consistent response format
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to create gallery.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
