// /server/api/server/[id].patch.ts
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'
import {
  buildServerUpdateData,
  canMutateServer,
  parseId,
  readServerById,
  requireAuthUser,
  safeServer,
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
    const data = buildServerUpdateData(
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {},
      user,
    )

    const updatedServer = await prisma.server.update({
      where: { id },
      data,
    })

    return {
      success: true,
      message: 'Server updated successfully.',
      data: safeServer(updatedServer, user),
    }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || 'Failed to update server.',
    }
  }
})
