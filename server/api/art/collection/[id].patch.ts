// server/api/art/collection/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'

export default defineEventHandler(async (event) => {
  let response
  let collectionId

  try {
    // Validate ID
    collectionId = Number(event.context.params?.id)
    if (isNaN(collectionId) || collectionId <= 0) {
      event.node.res.statusCode = 400
      throw createError({ statusCode: 400, message: 'Invalid collection ID.' })
    }

    // Verify token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader?.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Missing or invalid token.',
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

    // Fetch collection
    const collection = await prisma.artCollection.findUnique({
      where: { id: collectionId },
      include: { art: true },
    })
    if (!collection) {
      event.node.res.statusCode = 404
      throw createError({ statusCode: 404, message: 'Collection not found.' })
    }
    if (collection.userId !== user.id) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'Not authorized to update this collection.',
      })
    }

    // Read update data
    const body = await readBody(event)
    const { artIds, label, isPublic, isMature } = body

    const updateData: any = {}

    // Replace art list
    if (Array.isArray(artIds)) {
      if (!artIds.length) {
        throw createError({
          statusCode: 400,
          message: 'artIds must be a non-empty array.',
        })
      }
      if (!artIds.every(Number.isInteger)) {
        throw createError({
          statusCode: 400,
          message: 'All artIds must be integers.',
        })
      }

      const validArt = await prisma.art.findMany({
        where: { id: { in: artIds } },
      })
      if (validArt.length !== artIds.length) {
        const missing = artIds.filter(
          (id) => !validArt.some((art: Art) => art.id === id),
        )
        throw createError({
          statusCode: 404,
          message: `Missing art IDs: ${missing.join(', ')}`,
        })
      }

      updateData.art = { set: validArt.map((art: Art) => ({ id: art.id })) }
    }

    // Optional metadata updates
    if (typeof label === 'string') updateData.label = label.trim()
    if (typeof isPublic === 'boolean') updateData.isPublic = isPublic
    if (typeof isMature === 'boolean') updateData.isMature = isMature

    const updated = await prisma.artCollection.update({
      where: { id: collectionId },
      data: updateData,
      include: { art: true },
    })

    response = { success: true, data: updated }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message || `Failed to update collection ${collectionId}.`,
    }
  }

  return response
})
