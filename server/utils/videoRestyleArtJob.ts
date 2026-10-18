import { createHash, randomUUID } from 'node:crypto'
import { readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import prisma from '@/server/utils/prisma'
import { createError } from 'h3'
import {
  parseArtJobPayload,
  serializeArtJobPayload,
} from '@/server/utils/artJobPayload'
import { isVideoRestyleArtJobPayload } from '@/utils/artJobMedia'
import {
  restyleScheduleRecipe,
  type RestyleStyleWindow,
} from '@/utils/videoRestylePlan'
import {
  loadRestyleJob,
  restyleSourcePath,
  type VideoRestyleJob,
} from '@/server/utils/videoRestyleJobs'

export const RESTYLE_ARTJOB_MEDIA = 'video-restyle-vace'
const PROJECT_SLUG = 'coat-dance'

function grabBagRecipe(
  job: VideoRestyleJob,
  schedule: RestyleStyleWindow[] | undefined,
) {
  if (!schedule?.length) return {}
  return {
    variantMode: job.variantMode ?? 'cycle',
    ...restyleScheduleRecipe(schedule),
  }
}

// Absent on standard renders so their payloads, and the in-place sync that
// compares them, stay byte-identical to before Fast draft existed.
function speedRecipe(job: VideoRestyleJob) {
  return job.renderSpeed === 'fast' ? { renderSpeed: 'fast' as const } : {}
}

function trackedStatus(status: VideoRestyleJob['status']) {
  if (status === 'PILOT_RUNNING') return 'RUNNING' as const
  if (status === 'REVIEW' || status === 'DONE') return 'DONE' as const
  if (
    status === 'PILOT_FAILED' ||
    status === 'PILOT_BLOCKED' ||
    status === 'FAILED'
  ) {
    return 'FAILED' as const
  }
  return 'PENDING' as const
}

export async function syncRestylePilotArtJob(
  job: VideoRestyleJob,
): Promise<VideoRestyleJob> {
  if (!job.pilot || job.status === 'STAGED') return job

  // Revision one keeps the original fingerprint for existing, already-rendered pilots.
  // Later revisions get new ArtJobs, preserving the previous DONE record.
  const revision = job.pilot.revision ?? 1
  const fingerprint = createHash('sha256')
    .update(
      `coat-dance:pilot:${job.userId}:${job.id}` +
        (revision === 1 ? '' : `:revision:${revision}`),
    )
    .digest('hex')
  const status = trackedStatus(job.status)
  const payload = serializeArtJobPayload({
    media: RESTYLE_ARTJOB_MEDIA,
    engine: 'wan-vace',
    promptString: `${job.title}: motion-guided ${job.style} pilot. ${job.renderRecipe.stylePrompt}`,
    requestId: `coat-dance/${job.id}/pilot/${revision}`,
    attemptFingerprint: fingerprint,
    videoRestyle: {
      id: job.id,
      phase: 'pilot',
      revision,
      startSec: job.pilot.startSec,
      durationSec: job.pilot.durationSec,
      completedSegments: job.pilot.completedSegments,
      totalSegments: job.pilot.totalSegments,
      progress: job.progress,
      state: job.status,
      executor: 'kr-relay',
      quality: job.quality,
      stylePrompt: job.renderRecipe.stylePrompt,
      isPrivate: job.isPrivate ?? true,
      isMature: job.isMature ?? false,
      ...grabBagRecipe(job, job.pilot.styleSchedule),
      ...speedRecipe(job),
    },
    save: {
      isPublic: false,
      isMature: job.isMature ?? false,
      designer: PROJECT_SLUG,
      artCollectionIds: [],
    },
  })

  const linked = job.pilot.artJobId
    ? await prisma.artJob.findFirst({
        where: {
          id: job.pilot.artJobId,
          userId: job.userId,
          projectSlug: PROJECT_SLUG,
          attemptFingerprint: fingerprint,
        },
      })
    : null
  const found =
    linked ??
    (await prisma.artJob.findFirst({
      where: {
        userId: job.userId,
        projectSlug: PROJECT_SLUG,
        attemptFingerprint: fingerprint,
      },
      orderBy: { id: 'asc' },
    }))

  let artJobId: number
  if (found) {
    artJobId = found.id
    // KR Relay is authoritative once it claims a pilot. In particular, a
    // connection-refused failure may leave job.json at PILOT_QUEUED. Never
    // silently resurrect that FAILED ArtJob from a studio refresh.
    if (
      found.status === 'FAILED' &&
      job.status !== 'REVIEW' &&
      job.status !== 'DONE'
    ) {
      return {
        ...job,
        status: 'PILOT_FAILED',
        error:
          found.error || job.error || 'KR Relay could not render the pilot.',
        stage: 'Pilot failed on KR Relay. Retry the existing ArtJob.',
      }
    }
    if (found.status === 'RUNNING' && job.status === 'PILOT_QUEUED') {
      return {
        ...job,
        status: 'PILOT_RUNNING',
        stage: 'KR Relay is processing the pilot.',
      }
    }
    if (found.status === 'DONE' || found.status === 'RUNNING') return job
    if (
      found.status !== status ||
      found.payload !== payload ||
      (found.error ?? null) !== (job.error ?? null)
    ) {
      await prisma.artJob.update({
        where: { id: found.id },
        data: {
          status,
          payload,
          error: job.error,
          claimedBy: status === 'RUNNING' ? 'local-vace-worker' : null,
          claimedAt:
            status === 'RUNNING' ? (found.claimedAt ?? new Date()) : null,
        },
      })
    }
  } else {
    const created = await prisma.artJob.create({
      data: {
        userId: job.userId,
        projectSlug: PROJECT_SLUG,
        engine: 'COMFY',
        status,
        priority: -100,
        payload,
        attemptFingerprint: fingerprint,
        error: job.error,
        claimedBy: status === 'RUNNING' ? 'local-vace-worker' : null,
        claimedAt: status === 'RUNNING' ? new Date() : null,
      },
    })
    artJobId = created.id
  }

  if (job.pilot.artJobId === artJobId) return job
  const refreshed = JSON.parse(
    await readFile(
      path.join(path.dirname(restyleSourcePath(job)), 'job.json'),
      'utf8',
    ),
  ) as VideoRestyleJob
  if (
    refreshed.userId !== job.userId ||
    refreshed.id !== job.id ||
    !refreshed.pilot
  ) {
    throw new Error('Restyle pilot changed while recording its ArtJob.')
  }
  const updated: VideoRestyleJob = {
    ...refreshed,
    pilot: { ...refreshed.pilot, artJobId },
  }
  const destination = path.join(
    path.dirname(restyleSourcePath(job)),
    'job.json',
  )
  const temporary = `${destination}.${randomUUID()}.tmp`
  await writeFile(temporary, JSON.stringify(updated, null, 2), {
    flag: 'wx',
    mode: 0o600,
  })
  await rename(temporary, destination)
  return updated
}

/**
 * Delete one Coat Dance project: its private source, pilots and film.
 * Refused while KR Relay holds a claim on any of its ArtJobs. Queued and
 * failed ArtJobs are withdrawn first so a relay can never claim a project
 * whose source is gone; DONE rows stay as render history. Variants hold
 * their own copy of the source and are untouched.
 */
export async function deleteRestyleProject(
  userId: number,
  id: string,
): Promise<{ id: string; cancelledArtJobs: number }> {
  const job = await loadRestyleJob(userId, id)
  const linked = {
    userId,
    projectSlug: PROJECT_SLUG,
    payload: { contains: job.id },
  }
  const busy = () =>
    prisma.artJob.count({ where: { ...linked, status: 'RUNNING' } })
  const rendering = {
    statusCode: 409,
    message:
      'KR Relay is rendering this project right now. Let it finish or fail, then delete it.',
  }
  if (await busy()) throw createError(rendering)
  const cancelled = await prisma.artJob.updateMany({
    where: { ...linked, status: { in: ['PENDING', 'FAILED'] } },
    data: {
      status: 'CANCELLED',
      error: 'Coat Dance project deleted.',
      claimedBy: null,
      claimedAt: null,
    },
  })
  // A claim can land between the check and the cancel; keep the files then.
  if (await busy()) throw createError(rendering)
  const folder = path.dirname(restyleSourcePath(job))
  // Leave the listing in one step (the name is no longer a project id), then
  // remove the bytes. A failed removal leaves a hidden folder, never a
  // half-deleted project.
  const trash = path.join(
    path.dirname(folder),
    `.deleted-${job.id}-${randomUUID()}`,
  )
  await rename(folder, trash)
  await rm(trash, { recursive: true, force: true })
  return { id: job.id, cancelledArtJobs: cancelled.count }
}

/**
 * Retry one failed VACE pilot IN PLACE: ArtJob identity, saved source and
 * motion plan survive. Never run image-job normalizers over a video control
 * payload, and never create another ArtJob for an existing fingerprint.
 */
export async function retryFailedRestyleArtJob(
  id: number,
): Promise<VideoRestyleJob> {
  const artJob = await prisma.artJob.findUnique({ where: { id } })
  if (!artJob || !isVideoRestyleArtJobPayload(artJob.payload)) {
    throw createError({
      statusCode: 404,
      message: 'VACE pilot ArtJob not found.',
    })
  }
  if (artJob.status !== 'FAILED') {
    throw createError({
      statusCode: 409,
      message: 'Only a failed VACE pilot can be retried.',
    })
  }
  const payload = parseArtJobPayload(artJob.payload)
  const video = payload.videoRestyle as Record<string, unknown> | undefined
  if (video?.phase === 'full') return retryFailedRestyleFullArtJob(id)
  const pilotId = String(video?.id || '')
  const job = await loadRestyleJob(artJob.userId, pilotId)
  if (
    !job.pilot ||
    job.pilot.artJobId !== id ||
    job.status === 'REVIEW' ||
    job.status === 'DONE'
  ) {
    throw createError({
      statusCode: 409,
      message: 'Pilot source and ArtJob are not eligible for retry.',
    })
  }
  const next: VideoRestyleJob = {
    ...job,
    status: 'PILOT_QUEUED',
    stage: 'Queued for retry by KR Relay',
    progress: 0,
    error: null,
    resultFile: null,
    updatedAt: new Date().toISOString(),
    pilot: { ...job.pilot, completedSegments: 0 },
  }
  const target = path.join(path.dirname(restyleSourcePath(job)), 'job.json')
  const temporary = `${target}.${randomUUID()}.tmp`
  await writeFile(temporary, JSON.stringify(next, null, 2), {
    flag: 'wx',
    mode: 0o600,
  })
  await rename(temporary, target)

  const updatedPayload = {
    ...payload,
    videoRestyle: {
      ...video,
      completedSegments: 0,
      progress: 0,
      state: 'PILOT_QUEUED',
    },
  }
  const updated = await prisma.artJob.updateMany({
    where: { id, userId: job.userId, status: 'FAILED' },
    data: {
      status: 'PENDING',
      claimedBy: null,
      claimedAt: null,
      error: null,
      attempts: 0,
      payload: serializeArtJobPayload(updatedPayload),
    },
  })
  if (updated.count !== 1) {
    throw createError({
      statusCode: 409,
      message: 'The pilot changed while retrying; refresh before trying again.',
    })
  }
  return next
}

/**
 * Full-length results are separate ArtJobs; keep the approved pilot's DONE
 * row and protected MP4. The dedicated fingerprint makes reconciling safe.
 */
export async function syncRestyleFullArtJob(
  job: VideoRestyleJob,
): Promise<VideoRestyleJob> {
  if (!job.full) return job
  const fingerprint = createHash('sha256')
    .update(`coat-dance:full:${job.userId}:${job.id}`)
    .digest('hex')
  const status =
    job.status === 'FULL_RUNNING'
      ? 'RUNNING'
      : job.status === 'FULL_FAILED'
        ? 'FAILED'
        : job.status === 'DONE'
          ? 'DONE'
          : 'PENDING'
  const payload = serializeArtJobPayload({
    media: RESTYLE_ARTJOB_MEDIA,
    engine: 'wan-vace',
    promptString: `${job.title}: full-length ${job.style} film. ${job.renderRecipe.stylePrompt}`,
    requestId: `coat-dance/${job.id}/full`,
    attemptFingerprint: fingerprint,
    videoRestyle: {
      id: job.id,
      phase: 'full',
      startSec: 0,
      durationSec: job.full.durationSec,
      completedSegments: job.full.completedSegments,
      totalSegments: job.full.totalSegments,
      progress: job.progress,
      state: job.status,
      executor: 'kr-relay',
      quality: job.quality,
      stylePrompt: job.renderRecipe.stylePrompt,
      isPrivate: job.isPrivate ?? true,
      isMature: job.isMature ?? false,
      ...grabBagRecipe(job, job.full.styleSchedule),
      ...speedRecipe(job),
    },
    save: {
      isPublic: false,
      isMature: job.isMature ?? false,
      designer: PROJECT_SLUG,
      artCollectionIds: [],
    },
  })
  const linked = job.full.artJobId
    ? await prisma.artJob.findFirst({
        where: {
          id: job.full.artJobId,
          userId: job.userId,
          projectSlug: PROJECT_SLUG,
          attemptFingerprint: fingerprint,
        },
      })
    : null
  const found =
    linked ??
    (await prisma.artJob.findFirst({
      where: {
        userId: job.userId,
        projectSlug: PROJECT_SLUG,
        attemptFingerprint: fingerprint,
      },
    }))
  let artJobId: number
  if (found) {
    artJobId = found.id
    if (found.status === 'FAILED' && job.status !== 'DONE') {
      return {
        ...job,
        status: 'FULL_FAILED',
        stage: 'Full render failed. Requeue the existing ArtJob to resume.',
        error:
          found.error || job.error || 'KR Relay could not finish the film.',
      }
    }
    // A new relay poll can release abandoned claims back to PENDING. Do not
    // resurrect the orphaned RUNNING manifest or steal its queue slot.
    if (found.status === 'PENDING' && job.status === 'FULL_RUNNING') {
      return {
        ...job,
        status: 'FULL_QUEUED',
        stage:
          'Full render awaiting relay recovery; completed windows preserved.',
      }
    }
    if (found.status === 'RUNNING' && job.status === 'FULL_QUEUED') {
      return {
        ...job,
        status: 'FULL_RUNNING',
        stage: 'KR Relay is rendering the full film.',
      }
    }
    if (found.status === 'RUNNING' || found.status === 'DONE') return job
    if (found.status !== status || found.payload !== payload) {
      await prisma.artJob.update({
        where: { id: found.id },
        data: {
          status,
          payload,
          error: job.error,
          claimedBy: null,
          claimedAt: null,
        },
      })
    }
  } else {
    const created = await prisma.artJob.create({
      data: {
        userId: job.userId,
        projectSlug: PROJECT_SLUG,
        engine: 'COMFY',
        status,
        priority: -100,
        payload,
        attemptFingerprint: fingerprint,
        error: null,
      },
    })
    artJobId = created.id
  }
  if (job.full.artJobId === artJobId) return job
  const target = path.join(path.dirname(restyleSourcePath(job)), 'job.json')
  const current = JSON.parse(await readFile(target, 'utf8')) as VideoRestyleJob
  if (current.id !== job.id || current.userId !== job.userId || !current.full) {
    throw new Error('Full-length job changed during ArtJob registration.')
  }
  const next = { ...current, full: { ...current.full, artJobId } }
  const temp = `${target}.${randomUUID()}.tmp`
  await writeFile(temp, JSON.stringify(next, null, 2), {
    flag: 'wx',
    mode: 0o600,
  })
  await rename(temp, target)
  return next
}

export async function retryFailedRestyleFullArtJob(
  id: number,
): Promise<VideoRestyleJob> {
  const artJob = await prisma.artJob.findUnique({ where: { id } })
  if (!artJob || !isVideoRestyleArtJobPayload(artJob.payload)) {
    throw createError({
      statusCode: 404,
      message: 'Full-film ArtJob not found.',
    })
  }
  const payload = parseArtJobPayload(artJob.payload)
  const video = payload.videoRestyle as Record<string, unknown> | undefined
  if (video?.phase !== 'full' || artJob.status !== 'FAILED') {
    throw createError({
      statusCode: 409,
      message: 'Only failed full films can resume.',
    })
  }
  const job = await loadRestyleJob(artJob.userId, String(video.id || ''))
  if (
    !job.full ||
    job.full.artJobId !== id ||
    !['FULL_FAILED', 'FULL_RUNNING', 'FULL_QUEUED'].includes(job.status)
  ) {
    throw createError({
      statusCode: 409,
      message: 'Full-film manifest is not eligible for retry.',
    })
  }
  const next: VideoRestyleJob = {
    ...job,
    status: 'FULL_QUEUED',
    stage: 'Full film queued to resume completed windows',
    progress: 0,
    error: null,
    updatedAt: new Date().toISOString(),
    full: { ...job.full, completedSegments: 0 },
  }
  const updated = await prisma.artJob.updateMany({
    where: { id, userId: job.userId, status: 'FAILED' },
    data: {
      status: 'PENDING',
      claimedBy: null,
      claimedAt: null,
      error: null,
      attempts: 0,
      payload: serializeArtJobPayload({
        ...payload,
        videoRestyle: {
          ...video,
          completedSegments: 0,
          progress: 0,
          state: 'FULL_QUEUED',
        },
      }),
    },
  })
  if (updated.count !== 1) {
    throw createError({
      statusCode: 409,
      message: 'Full-film claim changed; refresh.',
    })
  }
  const target = path.join(path.dirname(restyleSourcePath(job)), 'job.json')
  const temp = `${target}.${randomUUID()}.tmp`
  await writeFile(temp, JSON.stringify(next, null, 2), {
    flag: 'wx',
    mode: 0o600,
  })
  await rename(temp, target)
  return next
}
