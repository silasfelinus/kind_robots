import { createError, defineEventHandler, getQuery, getRouterParam } from 'h3'
import { getImageStorageRoot } from '~/server/utils/imageStorageRoot'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { playbookFor } from '~/server/utils/playbook'
import { isPlaybookGame } from '~/utils/playbook/games'
import { inspectPlaybookArt } from '~/server/utils/playbookArtInventory'
import {
  projectJobs,
  type JobRow,
  type JobStatus,
  type LedgerJob,
} from '~/utils/playbookForge/ledger'

// Playbook Forge production ledger (conductor playbook-kit t-016): what the art
// relay has done for one playbook. A Playbook Studio game id returns its beats'
// art requests matched to their ArtJobs; any other project slug returns the
// project's job totals only. Read-only and admin-only. Render time runs from
// the relay claiming a job to its image being saved, as in /api/admin/art-review.
const MAX_JOBS = 5000

function seconds(from?: Date | null, to?: Date | null): number | null {
  if (!from || !to) return null
  const value = (to.getTime() - from.getTime()) / 1000
  return value >= 0 ? Math.round(value * 10) / 10 : null
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const slug = String(getRouterParam(event, 'slug') ?? '').trim()
    const studio = isPlaybookGame(slug) ? slug : null
    if (!studio && !/^[a-z0-9-]{2,64}$/.test(slug))
      throw createError({ statusCode: 404, message: 'Unknown playbook.' })
    const project = studio ? playbookFor(studio).artProject : slug
    const inventory = studio
      ? inspectPlaybookArt(playbookFor(studio), getImageStorageRoot())
      : { verified: {}, extras: { total: 0, delivered: 0, missing: [] } }
    if (getQuery(event).inventory === '1') {
      return {
        success: true,
        data: inventory,
        statusCode: 200,
      }
    }

    const notes = studio
      ? await prisma.playbookNote.findMany({
          where: {
            gameSlug: studio,
            kind: 'art-request',
            artJobId: { not: null },
            // A resolved request is superseded (2026-10-26: the ledger's
            // title-built prompts were cancelled and re-authored as rounds).
            resolved: false,
          },
          select: { nodeKey: true, artJobId: true },
          take: MAX_JOBS,
        })
      : []
    const edits = studio
      ? await prisma.playbookEdit.count({ where: { gameSlug: studio } })
      : 0
    const noteJobIds = notes.flatMap((n) => (n.artJobId ? [n.artJobId] : []))

    const jobs = await prisma.artJob.findMany({
      where: {
        OR: [
          { projectSlug: project },
          ...(noteJobIds.length ? [{ id: { in: noteJobIds } }] : []),
        ],
      },
      select: {
        id: true,
        status: true,
        engine: true,
        createdAt: true,
        claimedAt: true,
        updatedAt: true,
        artImageId: true,
        error: true,
      },
      orderBy: { id: 'desc' },
      take: MAX_JOBS,
    })
    const imageIds = jobs.flatMap((job) =>
      job.artImageId ? [job.artImageId] : [],
    )
    const images = imageIds.length
      ? await prisma.artImage.findMany({
          where: { id: { in: imageIds } },
          select: { id: true, createdAt: true },
        })
      : []
    const imageAt = new Map(images.map((image) => [image.id, image.createdAt]))

    const rows: JobRow[] = jobs.map((job) => {
      const finished =
        (job.artImageId ? imageAt.get(job.artImageId) : undefined) ??
        (job.status === 'DONE' ? job.updatedAt : null)
      return {
        id: job.id,
        status: job.status as JobStatus,
        engine: String(job.engine),
        createdAt: job.createdAt.toISOString(),
        renderSeconds:
          job.status === 'DONE' ? seconds(job.claimedAt, finished) : null,
        error: job.error ? job.error.slice(0, 280) : null,
        artImageId: job.artImageId ?? null,
      }
    })
    const rowById = new Map(rows.map((row) => [row.id, row]))
    const byNode: Record<string, LedgerJob[]> = {}
    for (const note of notes) {
      const row = note.artJobId ? rowById.get(note.artJobId) : undefined
      if (!row) continue
      const job: LedgerJob = {
        id: row.id,
        status: row.status,
        engine: row.engine,
        renderSeconds: row.renderSeconds,
        error: row.error,
        artImageId: row.artImageId,
      }
      byNode[note.nodeKey] = [...(byNode[note.nodeKey] ?? []), job]
    }

    event.node.res.statusCode = 200
    return {
      success: true,
      message: `${rows.length} jobs for ${project}.`,
      data: {
        slug,
        studio,
        project,
        edits,
        byNode,
        painted: inventory.verified,
        verified: inventory.verified,
        extras: inventory.extras,
        jobs: projectJobs(project, rows),
        truncated: jobs.length >= MAX_JOBS,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
