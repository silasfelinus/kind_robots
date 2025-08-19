// /server/api/blueprints/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../server/api/utils/prisma'
import { errorHandler } from '../../server/api/utils/error'
import { validateApiKey } from '../../server/api/utils/validateKey'

type BlueprintUpdateDTO = {
  title?: string
  description?: string
  steps?: any
  isPublic?: boolean
  isMature?: boolean
  coverArtId?: number
  tags?: number[]
}

export default defineEventHandler(async (event) => {
  let id = 0
  let response

  try {
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Blueprint ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    const existing = await prisma.blueprint.findUnique({
      where: { id },
    })
    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'Blueprint not found.',
      })
    }

    if (existing.userId !== userId && user.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this Blueprint.',
      })
    }

    const body = await readBody<BlueprintUpdateDTO>(event)
    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const data = await prisma.blueprint.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        steps: body.steps,
        isPublic: body.isPublic,
        isMature: body.isMature,
        coverArt: body.coverArtId
          ? { connect: { id: body.coverArtId } }
          : undefined,
        tags: body.tags
          ? {
              set: [],
              connect: body.tags.map((tagId) => ({ id: tagId })),
            }
          : undefined,
      },
    })

    response = {
      success: true,
      message: 'Blueprint updated successfully.',
      data,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message || `Failed to update Blueprint with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
