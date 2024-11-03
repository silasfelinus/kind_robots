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

    // Read and validate the gallery data from the request body
    const galleryData = (await readBody(event)) as Prisma.GalleryCreateInput

    // Validate required fields
    if (!galleryData.name || !galleryData.content) {
      throw createError({
        statusCode: 400,
        message:
          'Invalid data. "name" and "content" fields are required for creating a gallery.',
      })
    }

    // Prepare data with optional relations, connecting the authenticated user
    const data: Prisma.GalleryCreateInput = {
      ...galleryData,
      User: { connect: { id: user.id } }, // Link the gallery to the authenticated user
      ...(galleryData.Channel?.connect?.id && {
        Channel: { connect: { id: galleryData.Channel.connect.id } },
      }),
    }

    // Create the gallery entry
    const newGallery: Gallery = await prisma.gallery.create({
      data,
    })

    event.node.res.statusCode = 201 // Set status code to 201 Created
    return {
      success: true,
      newGallery,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      message: 'Failed to create gallery entry.',
      error: handledError.message,
      statusCode: event.node.res.statusCode,
    }
  }
})
