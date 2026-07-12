// /server/api/art/queue/stats.get.ts
//
// Admin aggregate view of the ArtJob pipeline for the dashboard. The existing
// queue/index.get.ts returns rows only; this returns the numbers you actually
// need to answer "is the pipeline healthy?": counts per status, oldest PENDING
// age, RUNNING jobs on a stale claim (the zombies), recent FAILED with errors,
// and images created — over a configurable window.
//
// Query: ?window=<hours> (default 24, max 720)
import { defineEventHandler, getQuery } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireAdminApiUser } from '../../../utils/authGuard'

// Mirror claim.post.ts STALE_CLAIM_MINUTES: a RUNNING job whose claim is older
// than this is considered stuck (its relay likely died mid-render).
const STALE_CLAIM_MINUTES = 15

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)

    const query = getQuery(event)
    const windowHours = Math.min(Math.max(Number(query.window) || 24, 1), 720)
    const since = new Date(Date.now() - windowHours * 3_600_000)
    const staleBefore = new Date(Date.now() - STALE_CLAIM_MINUTES * 60_000)

    const [
      statusGroups,
      windowStatusGroups,
      oldestPending,
      staleRunning,
      recentFailed,
      imagesInWindow,
      imagesByServer,
    ] = await Promise.all([
      // All-time queue depth per status.
      prisma.artJob.groupBy({ by: ['status'], _count: { _all: true } }),
      // Jobs created in the window, per status (throughput).
      prisma.artJob.groupBy({
        by: ['status'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
      // Oldest still-PENDING job (queue is stalled if this keeps climbing).
      prisma.artJob.findFirst({
        where: { status: 'PENDING' },
        orderBy: { id: 'asc' },
        select: { id: true, createdAt: true, engine: true, projectSlug: true },
      }),
      // RUNNING jobs whose claim went stale — the "zombie" symptom.
      prisma.artJob.findMany({
        where: { status: 'RUNNING', claimedAt: { lt: staleBefore } },
        orderBy: { claimedAt: 'asc' },
        take: 25,
        select: {
          id: true,
          engine: true,
          attempts: true,
          claimedAt: true,
          claimedBy: true,
          projectSlug: true,
        },
      }),
      // Recent FAILED jobs with their error text (distinguishes ComfyUI/SD down
      // vs save-generated failures).
      prisma.artJob.findMany({
        where: { status: 'FAILED' },
        orderBy: { id: 'desc' },
        take: 25,
        select: {
          id: true,
          engine: true,
          attempts: true,
          error: true,
          updatedAt: true,
          projectSlug: true,
        },
      }),
      prisma.artImage.count({ where: { createdAt: { gte: since } } }),
      prisma.artImage.groupBy({
        by: ['serverName'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
    ])

    const countByStatus = (
      groups: { status: string; _count: { _all: number } }[],
    ) =>
      groups.reduce<Record<string, number>>((acc, g) => {
        acc[g.status] = g._count._all
        return acc
      }, {})

    const now = Date.now()

    return {
      success: true,
      message: 'ArtJob pipeline stats.',
      data: {
        windowHours,
        since,
        queueDepth: countByStatus(statusGroups),
        windowThroughput: countByStatus(windowStatusGroups),
        oldestPending: oldestPending
          ? {
              ...oldestPending,
              ageSeconds: Math.round(
                (now - oldestPending.createdAt.getTime()) / 1000,
              ),
            }
          : null,
        staleRunningCount: staleRunning.length,
        staleRunning,
        recentFailed,
        imagesCreatedInWindow: imagesInWindow,
        imagesByServer: imagesByServer.map((g) => ({
          serverName: g.serverName,
          count: g._count._all,
        })),
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to load queue stats.',
      statusCode,
    }
  }
})
