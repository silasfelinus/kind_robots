// /server/api/comfy/test/info.get.ts
//
// Smoke probe of a Comfy server's own HTTP API (system_stats / queue).
// Auth once via requireMachineUser; no checkpoint (flux uses no checkpoint,
// and probing server info never needed one). Shares the Comfy client helpers
// with the generate smoke route.
import { createError, defineEventHandler, getQuery } from 'h3'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import { resolveServer } from '../../../utils/serverResolver'
import {
  assertComfyServer,
  fetchComfyInfo,
  getComfyBaseUrl,
} from '../../../utils/comfyTestClient'

type ComfyInfoTarget = 'system' | 'queue'

type ComfyInfoQuery = {
  serverId?: string
  serverName?: string
  target?: string
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event) as ComfyInfoQuery
    const auth = await requireMachineUser(event)
    const serverId = normalizeId(query.serverId)
    const target = normalizeTarget(query.target)

    const server = await resolveServer({
      userId: auth.user.id,
      serverId,
      serverName: query.serverName ?? null,
      capability: 'comfy',
    })

    assertComfyServer(server)

    const baseUrl = getComfyBaseUrl(server)
    const data = await fetchComfyInfo(baseUrl, target)

    return {
      success: true,
      message: `Comfy ${target} info fetched successfully.`,
      data,
      target,
      serverId: server.id,
      serverName: server.title,
      baseUrl,
      statusCode: 200,
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
