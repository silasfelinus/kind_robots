// /server/api/conductor/curate-request.post.ts
//
// Front-end → Conductor bridge for the ArtJob "Art trainer" panel. An admin picks
// finished ArtJob(s) in the queue and asks Conductor to curate them; this appends a
// request to conductor's projects/curation/requests.yaml (via the shared GitHub
// helpers). The conductor sweep (scripts/curate_art.py --requests) drains that file:
// it runs the vision assessor on each ArtImage and POSTs source=CURATOR feedback back
// to POST /api/art/queue/<job_id>/feedback, which fills the trainer panel.
//
// Mirrors the auth + GitHub-write pattern of api/conductor/art-request.post.ts.
import { defineEventHandler, readBody, createError } from 'h3'
import type { ArtJob } from '~/prisma/generated/prisma/client'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { userIsAdmin } from '@/server/utils/authUser'
import { validateApiKey } from '@/server/utils/validateKey'
import { conductorGet, conductorPut } from '@/server/utils/conductor-github'
import {
  type CurationRequestEntry,
  appendCurationRequest,
  CURATION_REQUESTS_SEED,
} from '@/server/utils/curationRequestYaml'

const REQUESTS_PATH = 'projects/curation/requests.yaml'
const REQUEST_SOURCE = 'kind-robots-artjob-trainer'

type CurateRequestBody = {
  jobId?: number | string
  jobIds?: Array<number | string>
  window?: number | string
  note?: string
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function toPositiveInt(value: unknown): number | null {
  const num = Number(value)
  return Number.isInteger(num) && num > 0 ? num : null
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

// Same prompt precedence the trainer/queue components use, so the queued request
// carries a human-readable brief for Conductor's curation log.
function jobPrompt(job: ArtJob): string {
  const payload = asRecord(job.payload)
  for (const key of ['promptString', 'artPrompt', 'positivePrompt', 'prompt']) {
    const value = payload[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function hasCuratorVerdict(job: ArtJob): boolean {
  const curation = asRecord(asRecord(job.payload).curation)
  return Boolean(curation.curator)
}

async function resolveJobIds(body: CurateRequestBody): Promise<number[]> {
  const explicit = new Set<number>()
  const single = toPositiveInt(body.jobId)
  if (single) explicit.add(single)
  if (Array.isArray(body.jobIds)) {
    for (const raw of body.jobIds) {
      const id = toPositiveInt(raw)
      if (id) explicit.add(id)
    }
  }
  if (explicit.size) return [...explicit]

  // Window fallback: every DONE job with an ArtImage finished within N hours that
  // Conductor has not already curated.
  const windowHours = toPositiveInt(body.window)
  if (windowHours) {
    const since = new Date(Date.now() - windowHours * 3600 * 1000)
    const jobs = await prisma.artJob.findMany({
      where: {
        status: 'DONE',
        artImageId: { not: null },
        updatedAt: { gte: since },
      },
      orderBy: { id: 'desc' },
      take: 200,
    })
    return jobs.filter((job) => !hasCuratorVerdict(job)).map((job) => job.id)
  }

  return []
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({ statusCode: 401, message: 'Invalid or expired token.' })
    }
    if (!userIsAdmin(user)) {
      throw createError({ statusCode: 403, message: 'Admin access required.' })
    }

    const body = await readBody<CurateRequestBody>(event).catch(
      () => ({}) as CurateRequestBody,
    )
    const note = cleanString(body.note).slice(0, 2000)

    const jobIds = await resolveJobIds(body)
    if (!jobIds.length) {
      throw createError({
        statusCode: 400,
        message:
          'Provide a jobId, a jobIds array, or a window (hours) of finished jobs to curate.',
      })
    }

    const jobs = await prisma.artJob.findMany({
      where: { id: { in: jobIds } },
    })
    const foundIds = new Set(jobs.map((job) => job.id))
    const missing = jobIds.filter((id) => !foundIds.has(id))

    // Only DONE jobs with an ArtImage can be curated (same gate as feedback.post.ts).
    const eligible = jobs.filter(
      (job) => job.status === 'DONE' && typeof job.artImageId === 'number',
    )
    const ineligible = jobs
      .filter((job) => !eligible.includes(job))
      .map((job) => job.id)

    if (!eligible.length) {
      throw createError({
        statusCode: 409,
        message:
          'No eligible jobs: curation needs completed jobs (status DONE) with a generated ArtImage.',
      })
    }

    const requestedAt = new Date().toISOString()
    const entries: CurationRequestEntry[] = eligible.map((job) => ({
      id: `curate-${job.id}`,
      source: REQUEST_SOURCE,
      status: 'pending',
      job_id: job.id,
      art_image_id: job.artImageId as number,
      project_slug: cleanString(job.projectSlug),
      prompt: jobPrompt(job),
      note,
      requested_at: requestedAt,
    }))

    // Load the queue once, append every new entry, write one commit. A missing file
    // is created from the documented seed.
    const existing = await conductorGet(REQUESTS_PATH)
    const before = existing?.content ?? CURATION_REQUESTS_SEED
    let next = before
    const created: number[] = []
    for (const entry of entries) {
      const merged = appendCurationRequest(next, entry)
      if (merged !== next) {
        created.push(entry.job_id)
        next = merged
      }
    }

    if (next !== before || !existing) {
      const message = created.length
        ? `curation: request ${created.map((id) => `job ${id}`).join(', ')}`
        : `curation: initialize ${REQUESTS_PATH}`
      await conductorPut(REQUESTS_PATH, next, message, existing?.sha)
    }

    const alreadyQueued = eligible
      .map((job) => job.id)
      .filter((id) => !created.includes(id))

    event.node.res.statusCode = created.length ? 201 : 200
    return {
      success: true,
      message: created.length
        ? `Queued ${created.length} job(s) for Conductor curation.`
        : 'All selected jobs were already queued for curation.',
      data: {
        requested: created,
        alreadyQueued,
        ineligible,
        missing,
      },
      statusCode: created.length ? 201 : 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to create Conductor curation request.',
      statusCode,
    }
  }
})
