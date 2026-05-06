// /server/api/server/health/[id].get.ts
import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from './../../../utils/prisma'
import { errorHandler } from './../../../utils/error'
import {
  buildServerHealthUrl,
  canReadServer,
  getOptionalAuthUser,
  parseId,
  readServerById,
} from './../../../utils/serverApi'

type HealthReport = {
  ok: boolean
  status: number
  statusText: string
  latencyMs: number
  responseBody: unknown
  message: string
}

async function readHealthBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || ''

  try {
    if (contentType.includes('application/json')) {
      return await response.json()
    }

    return await response.text()
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    const user = await getOptionalAuthUser(event)
    const server = await readServerById(id)

    if (!canReadServer(server, user)) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to test this server.',
      })
    }

    const mustRunInBrowser =
      server.requiresClientSideCheck ||
      server.isPrivateNetwork ||
      server.accessMode === 'LOCAL' ||
      server.accessMode === 'TAILSCALE' ||
      server.defaultTransport === 'BROWSER'

    const healthUrl = buildServerHealthUrl(
      server,
      mustRunInBrowser ? 'browser' : 'backend',
    )

    if (mustRunInBrowser) {
      event.node.res.statusCode = 202

      return {
        success: true,
        message:
          'This server must be tested from the browser because it uses a private, local, or Tailscale connection.',
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

    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'X-Kindrobots-Server-Token': process.env.ART_SERVER_PROXY_TOKEN ?? '',
      },
    })

    const responseBody = await readHealthBody(response)

    const report: HealthReport = {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      latencyMs: Date.now() - startedAt,
      responseBody,
      message: response.ok
        ? 'Server health check succeeded.'
        : `Health endpoint returned HTTP ${response.status}.`,
    }

    await prisma.server.update({
      where: { id },
      data: {
        lastCheckedAt: new Date(),
        lastStatus: response.ok ? 'ONLINE' : 'OFFLINE',
      },
    })

    event.node.res.statusCode = response.ok ? 200 : 502

    return {
      success: response.ok,
      message: report.message,
      data: {
        id: server.id,
        title: server.title,
        healthUrl,
        accessMode: server.accessMode,
        requiresClientSideCheck: server.requiresClientSideCheck,
        isPrivateNetwork: server.isPrivateNetwork,
        allowBrowserRequests: server.allowBrowserRequests,
        ok: report.ok,
        status: report.status,
        statusText: report.statusText,
        latencyMs: report.latencyMs,
        responseBody: report.responseBody,
        runLocation: 'server',
      },
      statusCode: response.ok ? 200 : 502,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || 'Failed to test server health.',
      statusCode: handledError.statusCode || 500,
    }
  }
})
