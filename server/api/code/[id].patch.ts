// /server/api/code/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { Code, Prisma } from '~/prisma/generated/prisma/client'

type CodePatchBody = Partial<
  Pick<
    Code,
    | 'title'
    | 'description'
    | 'icon'
    | 'graph'
    | 'isPublic'
    | 'isOfficial'
    | 'isActive'
  >
>

function normalizeGraph(graph: unknown): Prisma.InputJsonValue {
  if (!graph || typeof graph !== 'object') {
    throw createError({
      statusCode: 400,
      message: 'A valid graph object is required.',
    })
  }

  return graph as Prisma.InputJsonValue
}

export default defineEventHandler(async (event) => {
  let id = 0

  try {
    id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Code ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const existingCode = await prisma.code.findUnique({
      where: { id },
    })

    if (!existingCode || !existingCode.isActive) {
      throw createError({
        statusCode: 404,
        message: 'Code not found.',
      })
    }

    const isOwner = existingCode.userId === user.id
    const isAdmin = user.Role === 'ADMIN'

    if (!isOwner && !isAdmin) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this Code.',
      })
    }

    const body = await readBody<CodePatchBody>(event)
    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const data: Prisma.CodeUpdateInput = {}

    if (typeof body.title === 'string') {
      const title = body.title.trim()

      if (!title) {
        throw createError({
          statusCode: 400,
          message: 'Code title cannot be empty.',
        })
      }

      data.title = title
    }

    if ('description' in body) {
      data.description =
        typeof body.description === 'string' && body.description.trim()
          ? body.description.trim()
          : null
    }

    if ('icon' in body) {
      data.icon =
        typeof body.icon === 'string' && body.icon.trim()
          ? body.icon.trim()
          : null
    }

    if ('graph' in body) {
      data.graph = normalizeGraph(body.graph)
    }

    if (typeof body.isPublic === 'boolean') {
      data.isPublic = body.isPublic
    }

    if (typeof body.isActive === 'boolean') {
      data.isActive = body.isActive
    }

    if (typeof body.isOfficial === 'boolean') {
      if (!isAdmin) {
        throw createError({
          statusCode: 403,
          message: 'Only admins can change official Code status.',
        })
      }

      data.isOfficial = body.isOfficial
    }

    const updated = await prisma.code.update({
      where: { id },
      data,
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Code updated successfully.',
      data: updated,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    console.error(`[code.patch] Error updating Code ${id}:`, handled)

    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || `Failed to update Code with ID ${id}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
