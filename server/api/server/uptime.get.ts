// /server/api/server/uptime.get.ts
//
// Admin uptime report for art-generation servers. Aggregates the
// ServerHealthCheck time-series into per-server uptime % + a recent sample
// series (for sparklines) over a configurable window. Powers the Uptime panel
// of the ArtJob admin dashboard.
//
// Query: ?window=<hours> (default 24, max 720) ?serverType=COMFY|A1111
//        ?samples=<n> (recent samples per server, default 60, max 500)
import { defineEventHandler, getQuery } from 'h3'
import type { Prisma, ServerType } from '~/prisma/generated/prisma/client'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireAdminApiUser } from '../../utils/authGuard'

const SERVER_TYPES = new Set<ServerType>([
  'A1111',
  'COMFY',
  'OPENAI',
  'ANTHROPIC',
  'OLLAMA',
  'CUSTOM',
])

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)

    const query = getQuery(event)
    const windowHours = Math.min(Math.max(Number(query.window) || 24, 1), 720)
    const sampleLimit = Math.min(Math.max(Number(query.samples) || 60, 1), 500)
    const since = new Date(Date.now() - windowHours * 3_600_000)

    const serverWhere: Prisma.ServerWhereInput = {
      serverType: { in: ['A1111', 'COMFY'] },
    }

    const requestedType = String(query.serverType || '').toUpperCase()
    if (requestedType && SERVER_TYPES.has(requestedType as ServerType)) {
      serverWhere.serverType = requestedType as ServerType
    }

    const servers = await prisma.server.findMany({
      where: serverWhere,
      select: {
        id: true,
        title: true,
        label: true,
        serverType: true,
        isActive: true,
        lastStatus: true,
        lastCheckedAt: true,
      },
      orderBy: [{ serverType: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    })

    const reports = await Promise.all(
      servers.map(async (server) => {
        const [total, okCount, samples] = await Promise.all([
          prisma.serverHealthCheck.count({
            where: { serverId: server.id, checkedAt: { gte: since } },
          }),
          prisma.serverHealthCheck.count({
            where: {
              serverId: server.id,
              checkedAt: { gte: since },
              ok: true,
            },
          }),
          prisma.serverHealthCheck.findMany({
            where: { serverId: server.id, checkedAt: { gte: since } },
            select: {
              checkedAt: true,
              ok: true,
              status: true,
              latencyMs: true,
              source: true,
            },
            orderBy: { checkedAt: 'desc' },
            take: sampleLimit,
          }),
        ])

        const uptimePct =
          total > 0 ? Math.round((okCount / total) * 1000) / 10 : null
        const latencies = samples
          .map((s) => s.latencyMs)
          .filter((v): v is number => typeof v === 'number')
        const avgLatencyMs = latencies.length
          ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
          : null

        return {
          serverId: server.id,
          title: server.label || server.title,
          serverType: server.serverType,
          isActive: server.isActive,
          lastStatus: server.lastStatus,
          lastCheckedAt: server.lastCheckedAt,
          windowHours,
          sampleCount: total,
          okCount,
          uptimePct,
          avgLatencyMs,
          // chronological for charting
          samples: samples.reverse(),
        }
      }),
    )

    return {
      success: true,
      message: `Uptime for ${reports.length} server(s) over ${windowHours}h.`,
      data: { windowHours, since, servers: reports },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to load uptime.',
      statusCode,
    }
  }
})
