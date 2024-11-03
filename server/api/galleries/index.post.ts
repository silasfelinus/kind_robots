// /server/api/galleries/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let response

  try {
    // Validate the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
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
      event.node.res.statusCode = 401
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
      event.node.res.statusCode = 400
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
      User: { connect: { id: userId } }, // Link to authenticated user
      ...(galleryData.Channel?.connect?.id && {
        Channel: { connect: { id: galleryData.Channel.connect.id } },
      }),
    }

    // Create the gallery entry
    const newGallery = await prisma.gallery.create({ data })

    // Set status code to 201 Created
    event.node.res.statusCode = 201
    response = { success: true, newGallery, statusCode: 201 }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to create gallery entry.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
