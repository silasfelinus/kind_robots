export const MISSION_EVENT_LOG_KIND = 'rainbow-mission-event' as const

export const MISSION_EVENT_TYPES = [
  'visit',
  'return_visit',
  'fundraiser_click',
] as const

export type MissionEventType = (typeof MISSION_EVENT_TYPES)[number]

export type MissionEventInput = {
  event: MissionEventType
  source: string
  campaign: string
  placement: string
}

export type MissionEventLog = MissionEventInput & {
  kind: typeof MISSION_EVENT_LOG_KIND
  version: 1
}

const DIMENSION_MAX_LENGTH = 48
const DIMENSION_PATTERN = /[^a-z0-9]+/g

export function isMissionEventType(value: unknown): value is MissionEventType {
  return (
    typeof value === 'string' &&
    (MISSION_EVENT_TYPES as readonly string[]).includes(value)
  )
}

export function normalizeMissionDimension(
  value: unknown,
  fallback: string,
): string {
  if (typeof value !== 'string') return fallback

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(DIMENSION_PATTERN, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, DIMENSION_MAX_LENGTH)
    .replace(/-+$/g, '')

  return normalized || fallback
}

export function normalizeMissionEventInput(value: unknown): MissionEventInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const row = value as Record<string, unknown>
  if (!isMissionEventType(row.event)) return null

  return {
    event: row.event,
    source: normalizeMissionDimension(row.source, 'direct'),
    campaign: normalizeMissionDimension(row.campaign, 'none'),
    placement: normalizeMissionDimension(row.placement, 'unknown'),
  }
}

export function encodeMissionEventLog(input: MissionEventInput): string {
  const row: MissionEventLog = {
    kind: MISSION_EVENT_LOG_KIND,
    version: 1,
    ...input,
  }
  return JSON.stringify(row)
}

export function parseMissionEventLog(value: unknown): MissionEventLog | null {
  if (typeof value !== 'string') return null

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    if (
      parsed.kind !== MISSION_EVENT_LOG_KIND ||
      parsed.version !== 1 ||
      !isMissionEventType(parsed.event)
    ) {
      return null
    }

    return {
      kind: MISSION_EVENT_LOG_KIND,
      version: 1,
      event: parsed.event,
      source: normalizeMissionDimension(parsed.source, 'direct'),
      campaign: normalizeMissionDimension(parsed.campaign, 'none'),
      placement: normalizeMissionDimension(parsed.placement, 'unknown'),
    }
  } catch {
    return null
  }
}
