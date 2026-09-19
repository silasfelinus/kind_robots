// /server/api/admin/art-archive/entries/jobs.get.ts
//
// art-archive/t-028: lets the curation board show what happened to a
// preset-queued ArtJob (t-016) without an admin separately checking the
// general /api/art/queue for it. archiveEntryId only lives inside each job's
// JSON payload (buildArchiveEnqueuePayload.ts tags it there), so this narrows
// by the indexed projectSlug column first, then picks the most recent
// matching row per requested entry id via pickLatestArchiveEntryJobs. Never
// touches the entry or the job -- read-only status lookup.
import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { pickLatestArchiveEntryJobs } from '~/server/utils/pickLatestArchiveEntryJobs'

const MAX_IDS = 200
const RECENT_JOBS_SCANNED = 500

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)

    const query = getQuery(event)
    const entryIds = String(query.ids ?? '')
      .split(',')
      .map((raw) => Number(raw.trim()))
      .filter((id) => Number.isInteger(id) && id > 0)
      .slice(0, MAX_IDS)

    if (!entryIds.length) {
      return {
        success: true,
        message: 'No entry ids requested.',
        data: { jobs: {} },
        statusCode: 200,
      }
    }

    const recentJobs = await prisma.artJob.findMany({
      where: { projectSlug: 'art-archive' },
      orderBy: { id: 'desc' },
      take: RECENT_JOBS_SCANNED,
      select: { id: true, status: true, payload: true, updatedAt: true, error: true },
    })

    const jobs = pickLatestArchiveEntryJobs(recentJobs, entryIds)

    return {
      success: true,
      message: `${Object.keys(jobs).length} of ${entryIds.length} entry id(s) have a recorded job.`,
      data: { jobs },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to load archive preset job status.',
      statusCode,
    }
  }
})
