// /server/api/galleries/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Prisma } from '@prisma/client'

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

    // Prepare data with the authenticated user connected
    const data: Prisma.GalleryCreateInput = {
      name: galleryData.name,
      content: galleryData.content,
      description: galleryData.description || null,
      highlightImage: galleryData.highlightImage || null,
      url: galleryData.url || null,
      custodian: galleryData.custodian || null,
      imagePaths: galleryData.imagePaths || null,
      isMature: galleryData.isMature ?? false,
      isPublic: galleryData.isPublic ?? true,
      User: { connect: { id: user.id } }, // Link to authenticated user
      ...(galleryData.Channel?.connect?.id && {
        Channel: { connect: { id: galleryData.Channel.connect.id } },
      }),
    }

    // Create the gallery entry
    const newGallery = await prisma.gallery.create({ data })

    event.node.res.statusCode = 201 // Created
    return {
      success: true,
      newGallery,
    }
  } catch (error) {
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
