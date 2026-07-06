// /server/api/comfy/test/generate.post.ts
import { createError, defineEventHandler, getRequestHeaders, readBody } from 'h3'
import type { Server } from '~/prisma/generated/prisma/client'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import { resolveServer } from '../../../utils/serverResolver'
import { resolveCheckpointResource } from '../../art/utils/checkpointResource'

type ComfyDirectGenerateRequest = {
  serverId?: number | null
  serverName?: string | null
  checkpointId?: number | null
  checkpointResourceId?: number | null
  resourceId?: number | null
  prompt?: string | null
  negativePrompt?: string | null
  width?: number | null
  height?: number | null
  steps?: number | null
  cfg?: number | null
  guidance?: number | null
  seed?: number | null
  wildcardSeed?: number | null
  sampler?: string | null
  scheduler?: string | null
  denoise?: number | null
  timeoutMs?: number | null
  variant?: 'dev' | 'schnell' | null
}

type ComfyFluxGenerateResponse = {
  success: boolean
  message?: string
  statusCode?: number
  promptId?: string
  imageData?: string
  filename?: string
  mimeType?: string
  variant?: string
  serverId?: number
  serverName?: string
  baseUrl?: string
  mana?: unknown
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<ComfyDirectGenerateRequest>(event)
    const prompt = body.prompt?.trim()
    const checkpointId = resolveCheckpointId(body)

    if (!prompt) {
      throw createError({
        statusCode: 400,
        message: 'Missing required field: "prompt".',
      })
    }

    if (!checkpointId) {
      throw createError({
        statusCode: 400,
        message: 'Missing required field: "checkpointId".',
      })
    }

    const auth = await requireMachineUser(event)
    const server = await resolveServer({
      userId: auth.user.id,
      serverId: body.serverId ?? null,
      serverName: body.serverName ?? null,
      capability: 'comfy',
    })

    assertComfyServer(server)

    const checkpoint = await resolveCheckpointResource({
      requestData: { checkpointResourceId: checkpointId },
      server,
    })

    const response = await $fetch<ComfyFluxGenerateResponse>(
      '/api/comfy/flux/generate',
      {
        method: 'POST',
        headers: forwardAuthHeaders(getRequestHeaders(event)),
        body: {
          variant: body.variant === 'dev' ? 'dev' : 'schnell',
          serverId: server.id,
          prompt,
          negativePrompt: body.negativePrompt ?? '',
          width: body.width ?? 512,
          height: body.height ?? 512,
          steps: body.steps ?? 8,
          cfg: body.cfg ?? 1,
          guidance: body.guidance ?? 4,
          seed: body.seed ?? -1,
          wildcardSeed: body.wildcardSeed ?? -1,
          sampler: body.sampler ?? 'euler',
          scheduler: body.scheduler ?? 'normal',
          denoise: body.denoise ?? 1,
          timeoutMs: body.timeoutMs ?? 180_000,
        },
      },
    )

    if (!response.success) {
      event.node.res.statusCode = response.statusCode || 502

      return {
        ...response,
        status: 'error',
        checkpointId,
        checkpoint: checkpoint.checkpoint,
      }
    }

    return {
      ...response,
      status: 'done',
      checkpointId,
      checkpoint: checkpoint.checkpoint,
      mimeType: response.imageData?.match(/^data:([^;]+);base64,/)?.[1] ?? null,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      status: 'error',
      statusCode: handledError.statusCode || 500,
      message: handledError.message || 'Failed to generate Comfy test image.',
    }
  }
})

function resolveCheckpointId(body: ComfyDirectGenerateRequest): number | null {
  return (
    normalizeId(body.checkpointId) ??
    normalizeId(body.checkpointResourceId) ??
    normalizeId(body.resourceId)
  )
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

function forwardAuthHeaders(
  headers: ReturnType<typeof getRequestHeaders>,
): HeadersInit {
  const forwardedHeaders: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }

  for (const key of [
    'authorization',
    'x-beta-admin-token',
    'x-admin-token',
    'x-api-key',
  ]) {
    const value = headers[key]

    if (typeof value === 'string' && value.trim()) {
      forwardedHeaders[key] = value
    }
  }

  return forwardedHeaders
}
