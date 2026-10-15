import { createHash, randomUUID } from 'node:crypto'
import { readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import prisma from '@/server/utils/prisma'
import { serializeArtJobPayload } from '@/server/utils/artJobPayload'
import {
  restyleSourcePath,
  type VideoRestyleJob,
} from '@/server/utils/videoRestyleJobs'

export const RESTYLE_ARTJOB_MEDIA = 'video-restyle-vace'
const PROJECT_SLUG = 'coat-dance'

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

  const fingerprint = createHash('sha256')
    .update(`coat-dance:pilot:${job.userId}:${job.id}`)
    .digest('hex')
  const status = trackedStatus(job.status)
  const payload = serializeArtJobPayload({
    media: RESTYLE_ARTJOB_MEDIA,
    engine: 'wan-vace',
    promptString: `${job.title}: motion-guided Illustrious pilot. ${job.renderRecipe.stylePrompt}`,
    requestId: `coat-dance/${job.id}/pilot`,
    attemptFingerprint: fingerprint,
    videoRestyle: {
      id: job.id,
      phase: 'pilot',
      startSec: job.pilot.startSec,
      durationSec: job.pilot.durationSec,
      completedSegments: job.pilot.completedSegments,
      totalSegments: job.pilot.totalSegments,
      progress: job.progress,
      state: job.status,
      executor: 'local-vace-worker',
    },
    save: {
      isPublic: false,
      isMature: false,
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
