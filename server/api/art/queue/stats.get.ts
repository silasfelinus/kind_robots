// /server/api/art/queue/stats.get.ts
//
// Admin aggregate view of the ArtJob pipeline for the dashboard. The existing
// queue/index.get.ts returns rows only; this returns the numbers you actually
// need to answer "is the pipeline healthy?": counts per status, oldest PENDING
// age, RUNNING jobs on a stale claim (the zombies), recent FAILED with errors,
// and images created — over a configurable window.
//
// Query: ?window=<hours> (default 24, max 720)
//        ?summary=true returns the lightweight queue-card summary with three
//        focused queries instead of the full diagnostics pass.
import { defineEventHandler, getQuery } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireAdminApiUser } from '../../../utils/authGuard'
import { groupArtFailuresBySignature } from '../../../utils/artFailureSignature'

// Mirror claim.post.ts STALE_CLAIM_MINUTES: a RUNNING job whose claim is older
// than this is considered stuck (its relay likely died mid-render).
const STALE_CLAIM_MINUTES = 15
const HOSTBUF_FAILURE_SIGNATURE = 'hostbuf_file_reader_read failed'

function countByStatus(
  groups: { status: string; _count: { _all: number } }[],
): Record<string, number> {
  return groups.reduce<Record<string, number>>((acc, group) => {
    acc[group.status] = group._count._all
    return acc
  }, {})
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)

    const query = getQuery(event)
    const windowHours = Math.min(Math.max(Number(query.window) || 24, 1), 720)
    const summaryOnly = ['1', 'true', 'yes'].includes(
      String(query.summary || '')
        .trim()
        .toLowerCase(),
    )
    const since = new Date(Date.now() - windowHours * 3_600_000)
    const staleBefore = new Date(Date.now() - STALE_CLAIM_MINUTES * 60_000)

    if (summaryOnly) {
      const [statusGroups, oldestPending, staleRunningCount] =
        await Promise.all([
          prisma.artJob.groupBy({ by: ['status'], _count: { _all: true } }),
          prisma.artJob.findFirst({
            where: { status: 'PENDING' },
            orderBy: { id: 'asc' },
            select: {
              id: true,
              createdAt: true,
              engine: true,
              projectSlug: true,
            },
          }),
          prisma.artJob.count({
            where: { status: 'RUNNING', claimedAt: { lt: staleBefore } },
          }),
        ])
      const now = Date.now()

      return {
        success: true,
        message: 'ArtJob pipeline summary.',
        data: {
          windowHours,
          since,
          queueDepth: countByStatus(statusGroups),
          windowThroughput: {},
          oldestPending: oldestPending
            ? {
                ...oldestPending,
                ageSeconds: Math.round(
                  (now - oldestPending.createdAt.getTime()) / 1000,
                ),
              }
            : null,
          staleRunningCount,
          staleRunning: [],
          recentFailed: [],
          failuresBySignature: [],
          latestDoneAt: null,
          latestHostbufFailureAt: null,
          imagesCreatedInWindow: 0,
          imagesByServer: [],
        },
        statusCode: 200,
      }
    }

    const [
      statusGroups,
      windowStatusGroups,
      oldestPending,
      staleRunning,
      recentFailed,
      latestDone,
      latestHostbufFailure,
      imagesInWindow,
      imagesByServer,
    ] = await Promise.all([
      // All-time queue depth per status.
      prisma.artJob.groupBy({ by: ['status'], _count: { _all: true } }),
      // Jobs created in the window, per status. This is useful throughput
      // context, but deliberately NOT used as a recovery timestamp: a job can
      // finish long after it was created.
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
      // Latest FAILED jobs for human diagnostics. This sample is intentionally
      // independent from the requested window, so callers must use updatedAt
      // when they need time-bounded failure counts.
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
      // Actual completion time of the newest successful render. This is the
      // recovery fact a monitor needs; createdAt/windowThroughput cannot prove
      // that a renderer recovered after an outage.
      prisma.artJob.findFirst({
        where: { status: 'DONE' },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      // Persist the most recent host-buffer incident independently of the
      // 25-row recentFailed sample so an unresolved outage cannot silently age
      // out of monitoring simply because other failures happened afterward.
      prisma.artJob.findFirst({
        where: {
          status: 'FAILED',
          error: { contains: HOSTBUF_FAILURE_SIGNATURE },
        },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      prisma.artImage.count({ where: { createdAt: { gte: since } } }),
      prisma.artImage.groupBy({
        by: ['serverName'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
    ])

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
        failuresBySignature: groupArtFailuresBySignature(recentFailed),
        latestDoneAt: latestDone?.updatedAt ?? null,
        latestHostbufFailureAt: latestHostbufFailure?.updatedAt ?? null,
        imagesCreatedInWindow: imagesInWindow,
        imagesByServer: imagesByServer.map((group) => ({
          serverName: group.serverName,
          count: group._count._all,
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