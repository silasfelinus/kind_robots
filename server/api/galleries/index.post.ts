// /server/api/galleries/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Prisma, Gallery } from '@prisma/client'

export default defineEventHandler(async (event) => {
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

    // Read and validate the single gallery data
    const galleryData = (await readBody(event)) as Prisma.GalleryCreateInput

    // Ensure the userId in galleryData matches the authenticated user's ID
    if (
      galleryData.User?.connect?.id &&
      galleryData.User.connect.id !== user.id
    ) {
      throw createError({
        statusCode: 403,
        message: 'User ID in request does not match authenticated user.',
      })
    }

    // Validate required fields
    if (!galleryData.name || !galleryData.content) {
      throw createError({
        statusCode: 400,
        message:
          'Invalid data. "name" and "content" fields are required for creating a gallery.',
      })
    }

    // Prepare data with optional relations
    const data: Prisma.GalleryCreateInput = {
      ...galleryData,
      User: { connect: { id: user.id } }, // Use authenticated user ID
      ...(galleryData.Channel?.connect?.id && {
        Channel: { connect: { id: galleryData.Channel.connect.id } },
      }),
    }

    // Create the gallery entry
    const newGallery: Gallery = await prisma.gallery.create({
      data,
    })

    // Set status code to 201 Created for successful creation
    event.node.res.statusCode = 201
    return {
      success: true,
      newGallery,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message: 'Failed to create gallery entry.',
      error: handledError.message,
      statusCode: handledError.statusCode || 500,
    }
  }
})
