// server/api/conductor/projects.get.ts
//
// Conductor remains the coordination source of truth. This endpoint serves the
// latest authenticated one-way projection stored in the Kind Robots database,
// then overlays Kind Robots-owned presentation fields from Project records.
import { createError, defineEventHandler, setHeader } from 'h3'
import prisma from '@/server/utils/prisma'
import {
  buildConductorData,
  missingConductorData,
  type ConductorData,
  type ConductorMilestone,
  type ConductorPitch,
  type ConductorProject,
  type ConductorProjectDisplay,
  type ConductorTask,
} from '@/server/utils/conductorProjection'
import { readConductorProjection } from '@/server/utils/conductorProjectionDb'

export type {
  ConductorData,
  ConductorMilestone,
  ConductorPitch,
  ConductorProject,
  ConductorTask,
}

export default defineEventHandler(async (event): Promise<ConductorData> => {
  try {
    const stored = await readConductorProjection()
    if (!stored) {
      setHeader(event, 'Cache-Control', 'private, no-store')
      return missingConductorData()
    }

    const coordination = buildConductorData(
      stored.snapshot,
      new Map(),
      stored.syncedAt,
    )
    const slugs = coordination.projects.map((project) => project.slug)
    const displayRows = slugs.length
      ? await prisma.project.findMany({
          where: { conductorSlug: { in: slugs } },
          select: {
            conductorSlug: true,
            title: true,
            imagePath: true,
            cardPath: true,
            heroPath: true,
            liveUrl: true,
            channelKey: true,
            tabKey: true,
            repoUrl: true,
          },
        })
      : []

    const displays = new Map<string, ConductorProjectDisplay>()
    for (const row of displayRows) {
      if (!row.conductorSlug) continue
      displays.set(row.conductorSlug, row)
    }

    setHeader(
      event,
      'Cache-Control',
      'private, max-age=30, stale-while-revalidate=120',
    )
    return buildConductorData(stored.snapshot, displays, stored.syncedAt)
  } catch (error) {
    throw createError({
      statusCode: 502,
      message: `Conductor projection read failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    })
  }
})
