import { createError, getRequestIP, type H3Event } from 'h3'
import prisma from './prisma'
import {
  encodeMissionEventLog,
  parseMissionEventLog,
  type MissionEventInput,
  type MissionEventType,
} from '~/utils/missionMetricsContract'

const MISSION_LOG_USERNAME = 'rainbow-metrics'
const RATE_WINDOW_MS = 60_000
const RATE_WINDOW_MAX_EVENTS = 30

type RateWindow = {
  count: number
  resetAt: number
}

const rateWindows = new Map<string, RateWindow>()

export type MissionMetricSummary = {
  period: {
    days: number
    since: string
    through: string
  }
  visits: {
    first: number
    returning: number
    total: number
  }
  fundraiserClicks: {
    total: number
    byAttribution: Array<{
      source: string
      campaign: string
      count: number
    }>
    byPlacement: Array<{
      placement: string
      count: number
    }>
  }
  contributions: {
    human: number
    agent: number
    total: number
  }
  usefulObjects: {
    generatedArt: number
    publicAttachments: number
  }
  daily: Array<{
    date: string
    visit: number
    returnVisit: number
    fundraiserClick: number
  }>
  privacy: {
    visitorIdsStored: false
    ipAddressesStored: false
    exactEventTimesStored: false
    referrersStored: false
    userAgentsStored: false
    donationIdentitiesKnown: false
    donationAmountsKnown: false
  }
}

function rateLimitKey(event: H3Event): string {
  // The address is held only in process memory for this one-minute anti-abuse
  // window. It is never written to Log, returned by the API, or combined with
  // any other signal to form a visitor identifier.
  return getRequestIP(event, { xForwardedFor: true }) || 'unknown'
}

function sweepExpiredRateWindows(now: number): void {
  for (const [key, value] of rateWindows) {
    if (value.resetAt <= now) rateWindows.delete(key)
  }
}

export function assertMissionEventRateLimit(event: H3Event): void {
  const now = Date.now()
  sweepExpiredRateWindows(now)

  const key = rateLimitKey(event)
  const current = rateWindows.get(key)

  if (!current) {
    rateWindows.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return
  }

  if (current.count >= RATE_WINDOW_MAX_EVENTS) {
    event.node.res.setHeader(
      'Retry-After',
      String(Math.max(1, Math.ceil((current.resetAt - now) / 1000))),
    )
    throw createError({
      statusCode: 429,
      message: 'Too many mission metric events. Please try again shortly.',
    })
  }

  current.count += 1
}

function utcDayBucket(value = new Date()): Date {
  const day = new Date(value)
  day.setUTCHours(0, 0, 0, 0)
  return day
}

export async function recordMissionEvent(input: MissionEventInput): Promise<void> {
  await prisma.log.create({
    data: {
      message: encodeMissionEventLog(input),
      username: MISSION_LOG_USERNAME,
      userId: null,
      // Mission reporting needs daily trends, not an exact click timestamp.
      timestamp: utcDayBucket(),
    },
  })
}

function periodStart(days: number): Date {
  const start = utcDayBucket()
  start.setUTCDate(start.getUTCDate() - (days - 1))
  return start
}

function addCount(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1)
}

function eventKeyForDay(event: MissionEventType): 'visit' | 'returnVisit' | 'fundraiserClick' {
  if (event === 'return_visit') return 'returnVisit'
  if (event === 'fundraiser_click') return 'fundraiserClick'
  return 'visit'
}

export async function summarizeMissionMetrics(days: number): Promise<MissionMetricSummary> {
  const since = periodStart(days)
  const through = new Date()

  const [eventRows, humanContributions, agentContributions, generatedArt, publicAttachments] =
    await Promise.all([
      prisma.log.findMany({
        where: {
          username: MISSION_LOG_USERNAME,
          timestamp: { gte: since },
        },
        orderBy: { timestamp: 'asc' },
        select: { message: true, timestamp: true },
      }),
      prisma.chat.count({
        where: {
          type: 'ToForum',
          isPublic: true,
          isActive: true,
          botId: null,
          createdAt: { gte: since },
        },
      }),
      prisma.chat.count({
        where: {
          type: 'ToForum',
          isPublic: true,
          isActive: true,
          botId: { not: null },
          createdAt: { gte: since },
        },
      }),
      prisma.artJob.count({
        where: {
          projectSlug: 'rainbow-butterflies',
          status: 'DONE',
          artImageId: { not: null },
          createdAt: { gte: since },
        },
      }),
      prisma.chat.count({
        where: {
          type: 'ToForum',
          isPublic: true,
          isActive: true,
          createdAt: { gte: since },
          OR: [
            { artImageId: { not: null } },
            { projectId: { not: null } },
            { characterId: { not: null } },
          ],
        },
      }),
    ])

  let firstVisits = 0
  let returnVisits = 0
  let fundraiserClicks = 0
  const attribution = new Map<string, number>()
  const placements = new Map<string, number>()
  const daily = new Map<
    string,
    { visit: number; returnVisit: number; fundraiserClick: number }
  >()

  for (const row of eventRows) {
    const parsed = parseMissionEventLog(row.message)
    if (!parsed) continue

    if (parsed.event === 'visit') firstVisits += 1
    if (parsed.event === 'return_visit') returnVisits += 1
    if (parsed.event === 'fundraiser_click') {
      fundraiserClicks += 1
      addCount(attribution, `${parsed.source}\u0000${parsed.campaign}`)
      addCount(placements, parsed.placement)
    }

    const date = row.timestamp.toISOString().slice(0, 10)
    const bucket = daily.get(date) ?? {
      visit: 0,
      returnVisit: 0,
      fundraiserClick: 0,
    }
    bucket[eventKeyForDay(parsed.event)] += 1
    daily.set(date, bucket)
  }

  return {
    period: {
      days,
      since: since.toISOString(),
      through: through.toISOString(),
    },
    visits: {
      first: firstVisits,
      returning: returnVisits,
      total: firstVisits + returnVisits,
    },
    fundraiserClicks: {
      total: fundraiserClicks,
      byAttribution: [...attribution.entries()]
        .map(([key, count]) => {
          const [source, campaign] = key.split('\u0000')
          return { source, campaign, count }
        })
        .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source)),
      byPlacement: [...placements.entries()]
        .map(([placement, count]) => ({ placement, count }))
        .sort((a, b) => b.count - a.count || a.placement.localeCompare(b.placement)),
    },
    contributions: {
      human: humanContributions,
      agent: agentContributions,
      total: humanContributions + agentContributions,
    },
    usefulObjects: {
      generatedArt,
      publicAttachments,
    },
    daily: [...daily.entries()].map(([date, counts]) => ({ date, ...counts })),
    privacy: {
      visitorIdsStored: false,
      ipAddressesStored: false,
      exactEventTimesStored: false,
      referrersStored: false,
      userAgentsStored: false,
      donationIdentitiesKnown: false,
      donationAmountsKnown: false,
    },
  }
}
