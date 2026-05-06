// /server/api/server/[id].get.ts
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { errorHandler } from './../../utils/error'
import {
  canReadServer,
  getOptionalAuthUser,
  parseId,
  readServerById,
  safeServer,
} from './../../utils/serverApi'

export default defineEventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    const user = await getOptionalAuthUser(event)
    const server = await readServerById(id)

    if (!canReadServer(server, user)) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to view this server.',
      })
    }

    return {
      success: true,
      message: 'Server fetched successfully.',
      data: safeServer(server, user),
    }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || 'Failed to fetch server.',
    }
  }
})
