// server/api/conductor/progress.get.ts
//
// Percent complete per Conductor project slug, and nothing else.
//
// The home page's project strip only needs one number per project, but it used
// to call /api/conductor/projects, which returns every project in the registry
// (retired and paused included) with full task lists and notes -- roughly 2 MB
// of JSON for every first-time visitor. This serves the same `progress` figure
// (computed by buildConductorData, so the strip shows exactly the number the
// Conductor pages show) for active and continuous projects only, plus the
// member-app map (Conductor `parent:`) so lists can keep Daily Dream Workshop
// apps out of the first-tier project lists.
import { createError, defineEventHandler, setHeader } from 'h3'
import { buildConductorData } from '@/server/utils/conductorProjection'
import { readConductorProjection } from '@/server/utils/conductorProjectionDb'

export interface ConductorProgressResponse {
  syncedAt: string | null
  progress: Record<string, number>
  /** Member apps (Conductor `parent:`), keyed by slug -> parent slug. */
  members: Record<string, string>
}

const LIVE_STATUSES = new Set(['active', 'continuous'])

export default defineEventHandler(
  async (event): Promise<ConductorProgressResponse> => {
    try {
      const stored = await readConductorProjection()
      if (!stored) {
        setHeader(event, 'Cache-Control', 'public, max-age=30')
        return { syncedAt: null, progress: {}, members: {} }
      }

      const data = buildConductorData(
        stored.snapshot,
        new Map(),
        stored.syncedAt,
      )
      const progress: Record<string, number> = {}
      const members: Record<string, string> = {}
      for (const project of data.projects) {
        if (project.parentSlug) members[project.slug] = project.parentSlug
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
      return { syncedAt: stored.syncedAt ?? null, progress, members }
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
