type StartupTraceEvent = {
  at?: number
  name?: string
  detail?: unknown
  snapshot?: unknown
}

type StartupTraceBody = {
  traceId?: string
  buildId?: string
  reason?: string
  events?: StartupTraceEvent[]
  snapshot?: unknown
  userAgent?: string
}

const MAX_EVENTS = 80
const MAX_TEXT_LENGTH = 240

function clampText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  return value.slice(0, MAX_TEXT_LENGTH)
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 3) return '[depth-limited]'

  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number'
  ) {
    return value
  }

  if (typeof value === 'string') return value.slice(0, MAX_TEXT_LENGTH)

  if (Array.isArray(value)) {
    return value.slice(0, 24).map((entry) => sanitizeValue(entry, depth + 1))
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 32)
        .map(([key, entry]) => [
          key.slice(0, 80),
          sanitizeValue(entry, depth + 1),
        ]),
    )
  }

  return String(value).slice(0, MAX_TEXT_LENGTH)
}

export default defineEventHandler(async (event) => {
  const body = await readBody<StartupTraceBody>(event)
  const events = Array.isArray(body?.events)
    ? body.events.slice(-MAX_EVENTS).map((entry) => ({
        at: typeof entry.at === 'number' ? Math.round(entry.at) : undefined,
        name: clampText(entry.name),
        detail: sanitizeValue(entry.detail),
        snapshot: sanitizeValue(entry.snapshot),
      }))
    : []

  const payload = {
    traceId: clampText(body?.traceId) ?? 'unknown',
    buildId: clampText(body?.buildId),
    reason: clampText(body?.reason),
    eventCount: events.length,
    events,
    snapshot: sanitizeValue(body?.snapshot),
    userAgent:
      clampText(body?.userAgent) ?? clampText(getRequestHeader(event, 'user-agent')),
  }

  console.info(`[startup-trace] ${JSON.stringify(payload)}`)

  return { ok: true }
})
