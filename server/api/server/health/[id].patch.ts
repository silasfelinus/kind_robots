// /server/api/server/health/[id].patch.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { ServerStatus } from '~/prisma/generated/prisma/client'

type BrowserHealthReport = {
  ok?: boolean
  status?: number
  statusText?: string
  latencyMs?: number
  responseBody?: unknown
  message?: string
}

function resolveServerStatus(ok: boolean, status: number): ServerStatus {
  if (ok) return 'ONLINE'
  if (status > 0) return 'DEGRADED'
  return 'OFFLINE'
}

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    id = Number(event.context.params?.id)

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Server ID. Must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const server = await prisma.server.findUnique({
      where: { id },
    })

    if (!server) {
      throw createError({
        statusCode: 404,
        message: `Server with ID ${id} not found.`,
      })
    }

    const canUpdate = user.Role === 'ADMIN' || server.userId === user.id

    if (!canUpdate) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this Server health.',
      })
    }

    const body = await readBody<BrowserHealthReport>(event)
    const ok = Boolean(body.ok)
    const status = typeof body.status === 'number' ? body.status : 0
    const statusText =
      typeof body.statusText === 'string' && body.statusText.trim()
        ? body.statusText.trim().slice(0, 300)
        : ok
          ? 'OK'
          : 'Browser request failed'

    const latencyMs =
      typeof body.latencyMs === 'number' && Number.isFinite(body.latencyMs)
        ? Math.max(0, Math.round(body.latencyMs))
        : null

    const lastStatus = resolveServerStatus(ok, status)

    const updated = await prisma.server.update({
      where: { id },
      data: {
        lastCheckedAt: new Date(),
        lastStatus,
      },
    })

    return {
      success: true,
      message: ok
        ? 'Browser health check report saved.'
        : body.message || 'Browser health check failure saved.',
      data: {
        id: updated.id,
        title: updated.title,
        ok,
        status,
        statusText,
        latencyMs,
        lastStatus,
        lastCheckedAt: updated.lastCheckedAt,
        runLocation: 'browser',
      },
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message:
        handled.message || `Failed to update Server health with ID ${id}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
