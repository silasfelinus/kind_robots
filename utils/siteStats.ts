// Privacy-first site counters: daily aggregates only. Nothing here sees or
// returns an IP address, user agent, cookie or user id; a counter is a
// (Pacific day, kind, key) triple and a number.

export const SITE_STAT_KINDS = ['view', 'visit', 'event'] as const
export type SiteStatKind = (typeof SITE_STAT_KINDS)[number]

export type SiteStat = { kind: SiteStatKind; key: string }

export const SITE_STAT_KEY_MAX = 191
export const SITE_STAT_MAX_BODY_BYTES = 1024
export const SITE_STAT_MAX_PATH_SEGMENTS = 8
export const SITE_STAT_DIRECT = 'direct'
export const SITE_STAT_ZONE = 'America/Los_Angeles'
export const SITE_STAT_EVENT_PATTERN = /^[a-z0-9:_-]{1,64}$/
export const SITE_STAT_BOT_PATTERN = /bot|crawler|spider|preview|headless/i

const SELF_HOSTS = ['kindrobots.org', 'localhost', '127.0.0.1']
const HOST_PATTERN = /^[a-z0-9-]+(?:\.[a-z0-9-]+)*$/
const PATH_SEGMENT_PATTERN = /^[a-z0-9._~!$&'()*+,;=:@%-]+$/

function isIdSegment(segment: string): boolean {
  if (/^\d+$/.test(segment)) return true
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
      segment,
    )
  )
    return true
  if (/^[0-9a-f]{16,}$/.test(segment)) return true
  return /^[a-z0-9]{20,}$/.test(segment) && /\d/.test(segment)
}

export function isSiteStatKind(value: unknown): value is SiteStatKind {
  return (
    typeof value === 'string' &&
    (SITE_STAT_KINDS as readonly string[]).includes(value)
  )
}

export function normalizeSitePath(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null
  const path = trimmed.split(/[?#]/)[0]!.toLowerCase()
  const segments = path.split('/').filter(Boolean)
  if (segments.length > SITE_STAT_MAX_PATH_SEGMENTS) return null
  if (!segments.every((segment) => PATH_SEGMENT_PATTERN.test(segment)))
    return null
  const normalized =
    '/' +
    segments
      .map((segment) => (isIdSegment(segment) ? ':id' : segment))
      .join('/')
  return normalized.length <= SITE_STAT_KEY_MAX ? normalized : null
}

export function isSiteStatSelfHost(host: string): boolean {
  return SELF_HOSTS.some((self) => host === self || host.endsWith(`.${self}`))
}

export function normalizeReferrerHost(raw: unknown): string {
  if (typeof raw !== 'string') return SITE_STAT_DIRECT
  const trimmed = raw.trim().toLowerCase()
  if (!trimmed || trimmed === SITE_STAT_DIRECT) return SITE_STAT_DIRECT
  let host = trimmed
  if (trimmed.includes('/')) {
    try {
      host = new URL(trimmed).hostname
    } catch {
      return SITE_STAT_DIRECT
    }
  }
  host = host.replace(/^www\./, '').replace(/\.$/, '')
  if (!host || host.length > SITE_STAT_KEY_MAX || !HOST_PATTERN.test(host))
    return SITE_STAT_DIRECT
  return isSiteStatSelfHost(host) ? SITE_STAT_DIRECT : host
}

export function normalizeEventName(raw: unknown): string | null {
  return typeof raw === 'string' && SITE_STAT_EVENT_PATTERN.test(raw)
    ? raw
    : null
}

export function isSiteStatAdminPath(path: string): boolean {
  return path === '/admin' || path.startsWith('/admin/')
}

export function normalizeSiteStat(input: unknown): SiteStat | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const { kind, key } = input as Record<string, unknown>
  if (!isSiteStatKind(kind)) return null
  if (typeof key !== 'string' || key.length > SITE_STAT_KEY_MAX) return null
  if (kind === 'view') {
    const path = normalizeSitePath(key)
    return path && !isSiteStatAdminPath(path) ? { kind, key: path } : null
  }
  if (kind === 'visit') return { kind, key: normalizeReferrerHost(key) }
  const name = normalizeEventName(key)
  return name ? { kind, key: name } : null
}

export function isSiteStatBot(userAgent: unknown): boolean {
  if (typeof userAgent !== 'string' || !userAgent.trim()) return true
  return SITE_STAT_BOT_PATTERN.test(userAgent)
}

export function siteStatDay(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SITE_STAT_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function shiftSiteStatDay(day: string, offset: number): string {
  const date = new Date(`${day}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

export function clampSiteStatDays(raw: unknown, fallback = 30): number {
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 1) return fallback
  return Math.min(value, 90)
}

export type SiteStatRow = {
  day: Date | string
  kind: string
  key: string
  count: number
}

export type SiteStatDayTotal = { day: string; views: number; visits: number }
export type SiteStatRanked = { key: string; count: number }

export type SiteStatsSummary = {
  days: number
  from: string
  to: string
  totals: { views: number; visits: number; events: number }
  daily: SiteStatDayTotal[]
  topPaths: SiteStatRanked[]
  topReferrers: SiteStatRanked[]
  topEvents: SiteStatRanked[]
}

function rowDay(day: Date | string): string {
  return day instanceof Date ? day.toISOString().slice(0, 10) : day.slice(0, 10)
}

function ranked(counts: Map<string, number>, limit: number): SiteStatRanked[] {
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, limit)
}

export function summarizeSiteStats(
  rows: SiteStatRow[],
  days: number,
  today: string,
  limit = 15,
): SiteStatsSummary {
  const from = shiftSiteStatDay(today, 1 - days)
  const daily = new Map<string, SiteStatDayTotal>()
  for (let offset = 0; offset < days; offset += 1) {
    const day = shiftSiteStatDay(from, offset)
    daily.set(day, { day, views: 0, visits: 0 })
  }
  const byKind: Record<SiteStatKind, Map<string, number>> = {
    view: new Map(),
    visit: new Map(),
    event: new Map(),
  }
  const totals = { views: 0, visits: 0, events: 0 }
  for (const row of rows) {
    if (!isSiteStatKind(row.kind)) continue
    const day = daily.get(rowDay(row.day))
    if (!day) continue
    const count = Math.max(0, Math.trunc(row.count))
    const bucket = byKind[row.kind]
    bucket.set(row.key, (bucket.get(row.key) ?? 0) + count)
    if (row.kind === 'view') {
      day.views += count
      totals.views += count
    } else if (row.kind === 'visit') {
      day.visits += count
      totals.visits += count
    } else totals.events += count
  }
  return {
    days,
    from,
    to: today,
    totals,
    daily: [...daily.values()],
    topPaths: ranked(byKind.view, limit),
    topReferrers: ranked(byKind.visit, limit),
    topEvents: ranked(byKind.event, limit),
  }
}
