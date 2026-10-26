// /server/api/admin/site-stats.get.ts
//
// Admin-only summary of the first-party daily counters: per-day views and
// visits plus the top paths, referrer hosts and events for the last N Pacific
// days (?days=1..90, default 30).

import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import {
  clampSiteStatDays,
  shiftSiteStatDay,
  siteStatDay,
  summarizeSiteStats,
} from '~/utils/siteStats'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const days = clampSiteStatDays(getQuery(event).days)
    const today = siteStatDay()
    const from = shiftSiteStatDay(today, 1 - days)
    const rows = await prisma.siteStatDaily.findMany({
      where: { day: { gte: new Date(`${from}T00:00:00.000Z`) } },
      select: { day: true, kind: true, key: true, count: true },
    })
    return {
      success: true,
      data: summarizeSiteStats(rows, days, today),
      message: 'Site stats loaded.',
      statusCode: 200,
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
