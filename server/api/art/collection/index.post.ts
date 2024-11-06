// server/api/art/collection/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'

export default defineEventHandler(async (event) => {
  let response

  try {
    // Extract and verify the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Authorization token is required in the format "Bearer <token>".',
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

    // Parse the request body
    const body = await readBody(event)

    // Validate the JSON body
    if (!body || typeof body !== 'object') {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid JSON body.',
      })
    }

    // Retrieve and validate art IDs from the body
    const { artIds = [] } = body // Default artIds to an empty array if not provided

    if (!Array.isArray(artIds) || artIds.some(id => typeof id !== 'number')) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'artIds must be an array of valid numbers.',
      })
    }

    // Ensure all provided art IDs exist in the Art table
    const artList = artIds.length > 0
      ? await prisma.art.findMany({ where: { id: { in: artIds } } })
      : []

    if (artIds.length > 0 && artList.length !== artIds.length) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: 'One or more provided art IDs do not exist.',
      })
    }

    // Create the new art collection for the authenticated user
    const newCollection = await prisma.artCollection.create({
      data: {
        userId,
        art: {
          connect: artList.map(art => ({ id: art.id })),
        },
      },
      include: {
        art: true, // Include connected art in the response
      },
    })

    // Return the newly created collection, wrapped in a data object
    response = { success: true, data: { collection: newCollection } }
    event.node.res.statusCode = 201
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to create art collection.',
    }
  }

  return response
})
