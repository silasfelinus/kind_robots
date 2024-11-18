// server/api/art/collection/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'
import { validateApiKey } from './../../utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    // Authenticate the user via validateApiKey
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Parse and validate request body
    const body = await readBody(event)
    if (!body || typeof body !== 'object') {
      throw createError({
        statusCode: 400,
        message: 'Invalid JSON body.',
      })
    }

    const { artIds = [], label } = body
    if (!Array.isArray(artIds) || artIds.some((id) => typeof id !== 'number')) {
      throw createError({
        statusCode: 400,
        message: 'artIds must be an array of valid numbers.',
      })
    }

    // Verify all provided art IDs exist
    const artList =
      artIds.length > 0
        ? await prisma.art.findMany({ where: { id: { in: artIds } } })
        : []

    if (artIds.length > 0 && artList.length !== artIds.length) {
      throw createError({
        statusCode: 404,
        message: 'One or more provided art IDs do not exist.',
      })
    }

    // Create the art collection
    const data = await prisma.artCollection.create({
      data: {
        userId,
        label,
        art: {
          connect: artList.map((art) => ({ id: art.id })),
        },
      },
      include: {
        art: true,
      },
    })

    // Return the created collection with a success message
    event.node.res.statusCode = 201
    return {
      success: true,
      data,
      message: 'Art collection created successfully.',
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to create art collection.',
    }
  }
})
