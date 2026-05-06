// /server/api/server/health/[id].patch.ts
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from './../../../utils/prisma'
import { errorHandler } from './../../../utils/error'
import {
  canReadServer,
  getOptionalAuthUser,
  parseId,
  readServerById,
} from './../../../utils/serverApi'

type BrowserHealthReport = {
  ok?: boolean
  status?: number
  statusText?: string
  latencyMs?: number
  responseBody?: unknown
  message?: string
}

export default defineEventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    const user = await getOptionalAuthUser(event)
    const server = await readServerById(id)

    if (!canReadServer(server, user)) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this health report.',
      })
    }

    const body = (await readBody(event)) as BrowserHealthReport
    const ok = Boolean(body.ok)

    const updatedServer = await prisma.server.update({
      where: { id },
      data: {
        lastCheckedAt: new Date(),
        lastStatus: ok ? 'ONLINE' : 'OFFLINE',
      },
    })

    return {
      success: true,
      message: ok
        ? 'Browser health report saved.'
        : body.message || 'Browser health report saved as offline.',
      data: {
        id: updatedServer.id,
        title: updatedServer.title,
        lastCheckedAt: updatedServer.lastCheckedAt,
        lastStatus: updatedServer.lastStatus,
        ok,
        status: typeof body.status === 'number' ? body.status : 0,
        statusText:
          typeof body.statusText === 'string'
            ? body.statusText
            : ok
              ? 'OK'
              : 'Browser request failed',
        latencyMs: typeof body.latencyMs === 'number' ? body.latencyMs : 0,
        responseBody: body.responseBody ?? null,
        runLocation: 'browser',
      },
    }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || 'Failed to save health report.',
    }
  }
})
