// /server/api/server/health/[id].patch.ts
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { errorHandler } from './../../../utils/error'
import {
  canMutateServer,
  parseId,
  readServerById,
  recordServerHealthCheck,
  requireAuthUser,
} from './../../../utils/serverApi'

type BrowserHealthReport = {
  ok?: unknown
  status?: unknown
  statusText?: unknown
  latencyMs?: unknown
  responseBody?: unknown
  message?: unknown
}

const ALLOWED_FIELDS = new Set([
  'ok',
  'status',
  'statusText',
  'latencyMs',
  'responseBody',
  'message',
])

const MAX_RESPONSE_BODY_CHARS = 20_000

function cleanOptionalText(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string | null {
  if (typeof value === 'undefined' || value === null) return null

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be a string.`,
    })
  }

  const text = value.trim()

  if (text.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be ${maxLength} characters or fewer.`,
    })
  }

  return text || null
}

function cleanStatus(value: unknown): number {
  if (typeof value === 'undefined' || value === null) return 0

  const status = Number(value)

  if (!Number.isInteger(status) || status < 0 || status > 599) {
    throw createError({
      statusCode: 400,
      message: 'status must be an integer from 0 to 599.',
    })
  }

  return status
}

function cleanLatency(value: unknown): number {
  if (typeof value === 'undefined' || value === null) return 0

  const latencyMs = Number(value)

  if (!Number.isFinite(latencyMs) || latencyMs < 0 || latencyMs > 120_000) {
    throw createError({
      statusCode: 400,
      message: 'latencyMs must be a finite number from 0 to 120000.',
    })
  }

  return Math.round(latencyMs)
}

function cleanResponseBody(value: unknown): unknown {
  if (typeof value === 'undefined') return null

  let serialized = ''

  try {
    serialized = JSON.stringify(value)
  } catch {
    throw createError({
      statusCode: 400,
      message: 'responseBody must be JSON-serializable.',
    })
  }

  if (serialized.length > MAX_RESPONSE_BODY_CHARS) {
    throw createError({
      statusCode: 400,
      message: `responseBody must be ${MAX_RESPONSE_BODY_CHARS} characters or fewer when serialized.`,
    })
  }

  return value ?? null
}

export default defineEventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    const user = await requireAuthUser(event)
    const server = await readServerById(id)

    if (!canMutateServer(server, user)) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this server health report.',
      })
    }

    const body = await readBody<BrowserHealthReport>(event)

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message: 'A JSON health report is required.',
      })
    }

    const unknownFields = Object.keys(body).filter(
      (field) => !ALLOWED_FIELDS.has(field),
    )

    if (unknownFields.length) {
      throw createError({
        statusCode: 400,
        message: `Unsupported health report fields: ${unknownFields.join(', ')}.`,
      })
    }

    if (typeof body.ok !== 'boolean') {
      throw createError({
        statusCode: 400,
        message: 'ok must be a boolean.',
      })
    }

    const ok = body.ok
    const status = cleanStatus(body.status)
    const latencyMs = cleanLatency(body.latencyMs)
    const message = cleanOptionalText(body.message, 'message', 1_000)
    const statusText =
      cleanOptionalText(body.statusText, 'statusText', 255) ||
      (ok ? 'OK' : 'Browser request failed')
    const responseBody = cleanResponseBody(body.responseBody)
    const checkedAt = new Date()
    const lastStatus = ok ? 'ONLINE' : 'OFFLINE'

    await recordServerHealthCheck({
      serverId: id,
      ok,
      latencyMs,
      source: 'browser',
      note: ok ? null : message,
      checkedAt,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: ok
        ? 'Browser health report saved.'
        : message || 'Browser health report saved as offline.',
      data: {
        id: server.id,
        title: server.title,
        lastCheckedAt: checkedAt,
        lastStatus,
        ok,
        status,
        statusText,
        latencyMs,
        responseBody,
        runLocation: 'browser',
      },
      statusCode: 200,
    }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || 'Failed to save health report.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
