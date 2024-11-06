// server/api/art/image/index.post.ts

import { defineEventHandler, readBody, createError } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Parse the request body
    const body = await readBody(event)

    // Check if body is a valid object
    if (!body || typeof body !== 'object') {
      event.node.res.statusCode = 400
      throw createError({ statusCode: 400, message: 'Invalid JSON body' })
    }

    // Destructure required fields from the body
    const { artId, userId, ...imageData } = body // Use rest to allow model partials

    // Validate artId
    if (!artId || typeof artId !== 'number') {
      event.node.res.statusCode = 400
      throw createError({ statusCode: 400, message: 'Invalid or missing artId' })
    }

    // Validate userId
    if (!userId || typeof userId !== 'number') {
      event.node.res.statusCode = 400
      throw createError({ statusCode: 400, message: 'Invalid or missing userId' })
    }

    // Verify Bearer token matches userId
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
      throw createError({ statusCode: 401, message: 'Authorization token required in the format "Bearer <token>"' })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user || user.id !== userId) {
      event.node.res.statusCode = 403
      throw createError({ statusCode: 403, message: 'Token does not match user ID' })
    }

    // Ensure the artId exists
    const art = await prisma.art.findUnique({ where: { id: artId } })
    if (!art) {
      event.node.res.statusCode = 404
      throw createError({ statusCode: 404, message: `Art with ID ${artId} not found` })
    }

    // Create the new art image with provided partial model data
    const newArtImage = await prisma.artImage.create({
      data: {
        ...imageData,
        artId,
        userId,
      },
    })

    // Return the new art image wrapped in a data object
    event.node.res.statusCode = 201
    return { success: true, data: { artImage: newArtImage } }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    return { success: false, message: handledError.message }
  }
})
