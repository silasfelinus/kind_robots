// /server/api/server/[id].patch.ts
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'
import {
  assertServerOwnershipUnchanged,
  buildServerUpdateData,
  canMutateServer,
  parseId,
  readServerById,
  requireAuthUser,
  safeServer,
  validateServerEnums,
} from './../../utils/serverApi'

export default defineEventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    const user = await requireAuthUser(event)
    const server = await readServerById(id)

    if (!canMutateServer(server, user)) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this server.',
      })
    }

    if (!server.isEditable && !user.isAdmin) {
      throw createError({
        statusCode: 403,
        message: 'This server is not editable.',
      })
    }

    const body = await readBody(event)
    const safeBody =
      body && typeof body === 'object' && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {}

    validateServerEnums(safeBody)
    assertServerOwnershipUnchanged(safeBody, server.userId)

    const data = buildServerUpdateData(safeBody, user)
    const updatedServer = await prisma.server.update({
      where: { id },
      data,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Server updated successfully.',
      data: safeServer(updatedServer, user),
      statusCode: 200,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    const statusCode = handledError.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handledError.message || 'Failed to update server.',
      data: null,
      statusCode,
    }
  }
})
