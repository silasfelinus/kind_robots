// /server/api/comfy/test/info.get.ts
import { createError, defineEventHandler, getQuery } from 'h3'
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
  const checkpointId = Number(query.checkpointId)

  const resolved = await resolveComfyRun({
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
  const res = await fetch(url)
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
  }
})
