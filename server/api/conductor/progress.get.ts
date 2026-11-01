// server/api/conductor/progress.get.ts
//
// Percent complete per Conductor project slug, and nothing else.
//
// The home page's project strip only needs one number per project, but it used
// to call /api/conductor/projects, which returns every project in the registry
// (retired and paused included) with full task lists and notes -- roughly 2 MB
// of JSON for every first-time visitor. This serves the same `progress` figure
// (computed by buildConductorData, so the strip shows exactly the number the
// Conductor pages show) for active and continuous projects only.
import { createError, defineEventHandler, setHeader } from 'h3'
import { buildConductorData } from '@/server/utils/conductorProjection'
import { readConductorProjection } from '@/server/utils/conductorProjectionDb'

export interface ConductorProgressResponse {
  syncedAt: string | null
  progress: Record<string, number>
}

const LIVE_STATUSES = new Set(['active', 'continuous'])

export default defineEventHandler(
  async (event): Promise<ConductorProgressResponse> => {
    try {
      const stored = await readConductorProjection()
      if (!stored) {
        setHeader(event, 'Cache-Control', 'public, max-age=30')
        return { syncedAt: null, progress: {} }
      }

      const data = buildConductorData(
        stored.snapshot,
        new Map(),
        stored.syncedAt,
      )
      const progress: Record<string, number> = {}
      for (const project of data.projects) {
        const lifecycle = String(project.conductorStatus ?? 'active')
        if (!LIVE_STATUSES.has(lifecycle)) continue
        if (typeof project.progress !== 'number') continue
        progress[project.slug] = project.progress
      }

      setHeader(
        event,
        'Cache-Control',
        'public, max-age=60, stale-while-revalidate=300',
      )
      return { syncedAt: stored.syncedAt ?? null, progress }
    } catch (error) {
      throw createError({
        statusCode: 502,
        message: `Conductor progress read failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      })
    }
  },
)
