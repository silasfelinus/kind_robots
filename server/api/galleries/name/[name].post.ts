// /server/api/galleries/name/[name].post.ts
import type { H3Event } from 'h3'
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../utils/prisma'
import type { Gallery } from '@prisma/client'

interface ErrorWithStatusCode extends Error {
  statusCode?: number
}

export default defineEventHandler(async (event: H3Event) => {
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

    // Extract name from the request path
    const name = String(event.context.params?.name).trim()

    if (!name) {
      throw createError({
        statusCode: 400,
        message: 'Gallery name is required in the URL path.',
      })
    }

    // Read the gallery data from the request body
    const galleryData: Partial<Gallery> = await readBody(event)

    // Validate required fields
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
        userId, // Assign the authenticated user's ID
        highlightImage: galleryData.highlightImage ?? null,
        imagePaths: galleryData.imagePaths ?? null,
        isMature: galleryData.isMature ?? false,
        channelId: galleryData.channelId ?? null,
      },
    })

    // Set status code to 201 Created for successful creation
    event.node.res.statusCode = 201
    return { success: true, newGallery }
  } catch (error) {
    const typedError = error as ErrorWithStatusCode
    const { message, statusCode } = typedError
      ? {
          message: typedError.message,
          statusCode: typedError.statusCode || 500,
        }
      : { message: 'Unknown error', statusCode: 500 }

    return {
      success: false,
      message: 'Failed to create new gallery.',
      error: message,
      statusCode,
    }
  }
})
