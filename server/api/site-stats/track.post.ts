// /server/api/site-stats/track.post.ts
//
// Anonymous, cookie-free counter. Body: { kind: 'view' | 'visit' | 'event',
// key }. Adds one to today's (Pacific) aggregate for that key and stores
// nothing else: no IP address, user agent or user id. Bots, prefetches,
// oversized bodies and bursts are dropped without being counted.

import {
  createError,
  defineEventHandler,
  getHeader,
  getRequestIP,
  readRawBody,
} from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { allowSiteStatHit } from '../../utils/siteStatsDamping'
import {
  SITE_STAT_MAX_BODY_BYTES,
  isSiteStatBot,
  normalizeSiteStat,
  siteStatDay,
} from '~/utils/siteStats'

function ignored(reason: string) {
  return {
    success: true,
    data: { counted: false },
    message: reason,
    statusCode: 202,
  }
}

function isPrefetch(purpose: string | undefined): boolean {
  return /prefetch|prerender|preview/i.test(purpose ?? '')
}

export default defineEventHandler(async (event) => {
  try {
    const declaredLength = Number(getHeader(event, 'content-length') ?? 0)
    if (declaredLength > SITE_STAT_MAX_BODY_BYTES)
      throw createError({ statusCode: 413, message: 'Body too large.' })

    event.node.res.statusCode = 202
    if (isSiteStatBot(getHeader(event, 'user-agent'))) return ignored('Bot.')
    if (
      isPrefetch(getHeader(event, 'sec-purpose')) ||
      isPrefetch(getHeader(event, 'purpose'))
    )
      return ignored('Prefetch.')

    const raw = (await readRawBody(event, 'utf8')) ?? ''
    if (Buffer.byteLength(raw, 'utf8') > SITE_STAT_MAX_BODY_BYTES)
      throw createError({ statusCode: 413, message: 'Body too large.' })

    let body: unknown
    try {
      body = JSON.parse(raw)
    } catch {
      throw createError({ statusCode: 400, message: 'Body must be JSON.' })
    }
    const stat = normalizeSiteStat(body)
    if (!stat)
      throw createError({
        statusCode: 400,
        message: 'Unknown stat kind or key.',
      })

    if (!allowSiteStatHit(getRequestIP(event, { xForwardedFor: true }) ?? ''))
      return ignored('Slow down.')

    const day = siteStatDay()
    await prisma.$executeRaw`
      INSERT INTO \`SiteStatDaily\` (\`day\`, \`kind\`, \`key\`, \`count\`, \`updatedAt\`)
      VALUES (${day}, ${stat.kind}, ${stat.key}, 1, CURRENT_TIMESTAMP(3))
      ON DUPLICATE KEY UPDATE \`count\` = \`count\` + 1, \`updatedAt\` = CURRENT_TIMESTAMP(3)
    `
    return {
      success: true,
      data: { counted: true },
      message: 'Counted.',
      statusCode: 202,
    }
  } catch (error) {
    const failure = errorHandler(error)
    event.node.res.statusCode = failure.statusCode || 500
    return {
      success: false,
      message: failure.message,
      statusCode: event.node.res.statusCode,
    }
  }
})
