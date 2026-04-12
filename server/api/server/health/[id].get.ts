// /server/api/server/health/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

function buildHealthUrl(baseUrl: string, healthPath?: string | null) {
  const normalizedBase = baseUrl.replace(/\/+$/, '')
  const normalizedPath = healthPath
    ? healthPath.startsWith('/')
      ? healthPath
      : `/${healthPath}`
    : ''
  return `${normalizedBase}${normalizedPath}`
}

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Server ID. Must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    const server = await prisma.server.findUnique({
      where: { id },
    })

    if (!server) {
      throw createError({
        statusCode: 404,
        message: `Server with ID ${id} not found.`,
      })
    }

    const canView =
      server.isPublic ||
      (isValid && user && (user.Role === 'ADMIN' || server.userId === user.id))

    if (!canView) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to test this Server.',
      })
    }

    const healthUrl = buildHealthUrl(server.baseUrl, server.healthPath)
    const startedAt = Date.now()

    let ok = false
    let status = 0
    let statusText = 'Unknown'
    let responseBody: unknown = null

    try {
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
      })

      ok = response.ok
      status = response.status
      statusText = response.statusText

      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        responseBody = await response.json()
      } else {
        responseBody = await response.text()
      }
    } catch (fetchError: any) {
      statusText = fetchError?.message || 'Request failed'
    }

    const latencyMs = Date.now() - startedAt

    await prisma.server.update({
      where: { id },
      data: {
        lastCheckedAt: new Date(),
        lastStatus: ok ? 'ONLINE' : 'OFFLINE',
      },
    })

    event.node.res.statusCode = ok ? 200 : 502
    return {
      success: ok,
      message: ok
        ? 'Server health check succeeded.'
        : 'Server health check failed.',
      data: {
        id: server.id,
        title: server.title,
        healthUrl,
        ok,
        status,
        statusText,
        latencyMs,
        responseBody,
      },
      statusCode: event.node.res.statusCode,
    }
  } catch (error) {
    const handled = errorHandler(error)
    console.error('[server.health] Error:', handled)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || `Failed to test Server with ID ${id}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
