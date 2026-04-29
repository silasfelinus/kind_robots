// /server/api/server/health/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

const HEALTH_TIMEOUT_MS = 8000

function buildHealthUrl(baseUrl: string, healthPath?: string | null): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '')
  const normalizedPath = healthPath
    ? healthPath.startsWith('/')
      ? healthPath
      : `/${healthPath}`
    : ''

  return `${normalizedBase}${normalizedPath}`
}

async function parseHealthResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || ''

  try {
    if (contentType.includes('application/json')) {
      return await response.json()
    }

    const text = await response.text()
    return text.length > 1500 ? `${text.slice(0, 1500)}...` : text
  } catch {
    return null
  }
}

function shouldUseClientSideHealthCheck(server: {
  accessMode?: string | null
  requiresClientSideCheck?: boolean | null
  isPrivateNetwork?: boolean | null
  allowBrowserRequests?: boolean | null
}): boolean {
  return Boolean(
    server.requiresClientSideCheck ||
    server.accessMode === 'TAILSCALE' ||
    server.accessMode === 'LOCAL' ||
    (server.isPrivateNetwork && server.allowBrowserRequests),
  )
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

    let parsedUrl: URL

    try {
      parsedUrl = new URL(healthUrl)
    } catch {
      throw createError({
        statusCode: 400,
        message: `Invalid health URL: ${healthUrl}`,
      })
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw createError({
        statusCode: 400,
        message: 'Health URL must use http or https.',
      })
    }

    if (shouldUseClientSideHealthCheck(server)) {
      event.node.res.statusCode = 202

      return {
        success: true,
        message:
          'This server must be tested from the browser because it uses a private or Tailscale connection.',
        data: {
          id: server.id,
          title: server.title,
          healthUrl,
          accessMode: server.accessMode,
          requiresClientSideCheck: server.requiresClientSideCheck,
          isPrivateNetwork: server.isPrivateNetwork,
          allowBrowserRequests: server.allowBrowserRequests,
          runLocation: 'browser',
        },
        statusCode: 202,
      }
    }

    const startedAt = Date.now()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)

    let ok = false
    let status = 0
    let statusText = 'Unknown'
    let responseBody: unknown = null
    let failureReason: string | null = null

    try {
      const headers: HeadersInit = {
        Accept: 'application/json, text/plain, */*',
      }

      if (server.requiresApiKey && server.apiKey && server.apiKeyName) {
        headers[server.apiKeyName] = server.apiKey
      }

      const response = await fetch(healthUrl, {
        method: 'GET',
        headers,
        signal: controller.signal,
      })

      ok = response.ok
      status = response.status
      statusText = response.statusText || 'Unknown'
      responseBody = await parseHealthResponse(response)

      if (!ok) {
        failureReason = `Health endpoint returned HTTP ${status}.`
      }
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : 'Request failed'

      statusText =
        fetchError instanceof DOMException && fetchError.name === 'AbortError'
          ? 'Request timed out'
          : message

      failureReason = statusText
    } finally {
      clearTimeout(timeout)
    }

    const latencyMs = Date.now() - startedAt
    const lastStatus = ok ? 'ONLINE' : status > 0 ? 'DEGRADED' : 'OFFLINE'

    await prisma.server.update({
      where: { id },
      data: {
        lastCheckedAt: new Date(),
        lastStatus,
      },
    })

    event.node.res.statusCode = ok ? 200 : 502

    return {
      success: ok,
      message: ok
        ? 'Server health check succeeded.'
        : failureReason || 'Server health check failed.',
      data: {
        id: server.id,
        title: server.title,
        healthUrl,
        ok,
        status,
        statusText,
        latencyMs,
        responseBody,
        runLocation: 'server',
      },
      statusCode: event.node.res.statusCode,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || `Failed to test Server with ID ${id}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
