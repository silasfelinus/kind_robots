// /server/api/comfy/test/info.get.ts
import { createError, defineEventHandler, getQuery } from 'h3'
import prisma from '../../../utils/prisma'
import { getServerEndpoint } from '../../../utils/serverResolver'
import { resolveComfyRun } from './resolveComfyRun'

async function readJsonResponse(res: Response) {
  const contentType = res.headers.get('content-type') || ''
  const text = await res.text()

  if (!contentType.includes('application/json')) {
    return {
      json: null,
      text,
    }
  }

  try {
    return {
      json: JSON.parse(text),
      text,
    }
  } catch {
    return {
      json: null,
      text,
    }
  }
}

function cleanComfyBaseUrl(url: string) {
  const trimmed = url.replace(/\/+$/, '')

  if (trimmed.endsWith('/prompt')) {
    return trimmed.replace(/\/prompt$/, '')
  }

  if (trimmed.endsWith('/api/prompt')) {
    return trimmed.replace(/\/api\/prompt$/, '')
  }

  return trimmed
}

async function resolveComfyInfoTarget(input: {
  serverId: number
  checkpointId?: number | null
}) {
  if (!Number.isFinite(input.serverId) || input.serverId <= 0) {
    throw createError({
      statusCode: 400,
      message: 'Valid serverId is required.',
    })
  }

  if (input.checkpointId && input.checkpointId > 0) {
    return await resolveComfyRun({
      serverId: input.serverId,
      checkpointId: input.checkpointId,
    })
  }

  const server = await prisma.server.findUnique({
    where: {
      id: input.serverId,
    },
  })

  if (!server) {
    throw createError({
      statusCode: 404,
      message: `Server ${input.serverId} not found.`,
    })
  }

  if (server.serverType !== 'COMFY' && server.generationEngine !== 'COMFY') {
    throw createError({
      statusCode: 400,
      message: `Server ${server.id} is not a Comfy server.`,
    })
  }

  return {
    serverId: server.id,
    checkpointId: null,
    baseUrl: cleanComfyBaseUrl(getServerEndpoint(server, 'backend')),
  }
}

export default defineEventHandler(async (event) => {
  const authorizationHeader = event.node.req.headers.authorization

  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message:
        'Authorization token is required in the format "Bearer <token>".',
    })
  }

  const query = getQuery(event)
  const target = String(query.target || 'system')
  const serverId = Number(query.serverId)
  const checkpointId = query.checkpointId ? Number(query.checkpointId) : null

  const resolved = await resolveComfyInfoTarget({
    serverId,
    checkpointId,
  })

  const pathByTarget: Record<string, string> = {
    system: '/system_stats',
    queue: '/queue',
    objectInfo: '/object_info',
    history: '/history',
  }

  const path = pathByTarget[target]

  if (!path) {
    return {
      success: false,
      statusCode: 400,
      message: `Unknown Comfy info target: ${target}`,
      allowedTargets: Object.keys(pathByTarget),
    }
  }

  const url = `${resolved.baseUrl}${path}`

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-Kindrobots-Server-Token': process.env.ART_SERVER_PROXY_TOKEN ?? '',
    },
  })

  const parsed = await readJsonResponse(res)

  if (!res.ok) {
    return {
      success: false,
      statusCode: res.status,
      message: `Comfy info request failed with HTTP ${res.status}`,
      debug: parsed.json ?? parsed.text.slice(0, 500),
      resolved: {
        serverId: resolved.serverId,
        checkpointId: resolved.checkpointId,
        baseUrl: resolved.baseUrl,
        url,
      },
    }
  }

  return {
    success: true,
    target,
    data: parsed.json,
    serverId: resolved.serverId,
    checkpointId: resolved.checkpointId,
    baseUrl: resolved.baseUrl,
    url,
  }
})
