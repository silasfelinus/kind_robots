// /server/api/comfy/test/info.get.ts
import { createError, defineEventHandler, getQuery } from 'h3'
import type { Server } from '~/prisma/generated/prisma/client'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import { getServerEndpoint, resolveServer } from '../../../utils/serverResolver'
import { resolveCheckpointResource } from '../../art/utils/checkpointResource'

type ComfyInfoTarget = 'system' | 'queue'

type ComfyInfoQuery = {
  serverId?: string
  serverName?: string
  checkpointId?: string
  target?: string
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event) as ComfyInfoQuery
    const auth = await requireMachineUser(event)
    const serverId = normalizeId(query.serverId)
    const checkpointId = normalizeId(query.checkpointId)
    const target = normalizeTarget(query.target)

    const server = await resolveServer({
      userId: auth.user.id,
      serverId,
      serverName: query.serverName ?? null,
      capability: 'comfy',
    })

    assertComfyServer(server)

    if (checkpointId) {
      await resolveCheckpointResource({
        requestData: { checkpointResourceId: checkpointId },
        server,
      })
    }

    const baseUrl = getComfyBaseUrl(server)
    const data = await fetchComfyInfo(baseUrl, target)

    return {
      success: true,
      message: `Comfy ${target} info fetched successfully.`,
      data,
      target,
      checkpointId,
      serverId: server.id,
      serverName: server.title,
      baseUrl,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      statusCode: handledError.statusCode || 500,
      message: handledError.message || 'Failed to fetch Comfy test info.',
    }
  }
})

function normalizeTarget(target?: string | null): ComfyInfoTarget {
  if (target === 'queue' || target === 'system') return target

  throw createError({
    statusCode: 400,
    message: 'Invalid target. Use "system" or "queue".',
  })
}

function normalizeId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isInteger(parsed) && parsed > 0) return parsed
  }

  return null
}

function assertComfyServer(server: Server): void {
  if (!server.isActive) {
    throw createError({
      statusCode: 400,
      message: `Server "${server.title}" is not active.`,
    })
  }

  if (server.serverType !== 'COMFY') {
    throw createError({
      statusCode: 400,
      message: `Server "${server.title}" is ${server.serverType}. This route only supports Comfy servers.`,
    })
  }
}

function getComfyBaseUrl(server: Server): string {
  const endpoint = getServerEndpoint(server)
  const trimmed = endpoint.replace(/\/+$/, '')

  if (trimmed.endsWith('/prompt')) {
    return trimmed.replace(/\/prompt$/, '')
  }

  if (trimmed.endsWith('/api/prompt')) {
    return trimmed.replace(/\/api\/prompt$/, '')
  }

  return trimmed
}

async function fetchComfyInfo(
  baseUrl: string,
  target: ComfyInfoTarget,
): Promise<unknown> {
  const path = target === 'system' ? 'system_stats' : 'queue'
  const response = await fetch(`${baseUrl}/${path}`, {
    method: 'GET',
    headers: getComfyHeaders(),
  })

  if (!response.ok) {
    const details = await readResponseDetails(response)

    throw createError({
      statusCode: 502,
      message: `Comfy ${target} info failed: ${response.status} ${
        response.statusText
      }${details ? ` - ${details}` : ''}`,
    })
  }

  return await response.json()
}

function getComfyHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json, image/*, */*',
  }

  const token = process.env.ART_SERVER_PROXY_TOKEN || ''

  if (token) {
    headers['X-Kindrobots-Server-Token'] = token
  }

  return headers
}

async function readResponseDetails(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      return stringifyServerError(await response.json())
    }

    return await response.text()
  } catch {
    return response.statusText
  }
}

function stringifyServerError(errorData: unknown): string {
  if (!errorData) return ''

  if (typeof errorData === 'string') return errorData

  if (typeof errorData === 'object') {
    const data = errorData as Record<string, unknown>
    const message = data.message
    const error = data.error
    const detail = data.detail

    if (typeof error === 'string') return error
    if (typeof message === 'string') return message
    if (typeof detail === 'string') return detail

    return JSON.stringify(data)
  }

  return String(errorData)
}
