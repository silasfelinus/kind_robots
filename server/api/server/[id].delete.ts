// /server/api/server/[id].delete.ts
import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'
import {
  canDeleteServer,
  parseId,
  readServerById,
  requireAuthUser,
} from './../../utils/serverApi'

export default defineEventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    const user = await requireAuthUser(event)
    const server = await readServerById(id)

    if (!canDeleteServer(server, user)) {
      throw createError({
        statusCode: 403,
        message:
          'You can only delete your own private, non-default, non-official servers.',
      })
    }

    await prisma.server.delete({
      where: { id },
    })

    return {
      success: true,
      message: 'Server deleted successfully.',
    }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || 'Failed to delete server.',
    }
  }
})
