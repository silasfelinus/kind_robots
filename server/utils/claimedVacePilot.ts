import { createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { isVideoRestyleArtJobPayload } from '@/utils/artJobMedia'
import { loadRestyleJob } from '@/server/utils/videoRestyleJobs'
import { parseArtJobPayload } from '@/server/utils/artJobPayload'

export async function requireClaimedVacePilot(
  id: string,
  artJobId: number,
  agentId: string,
) {
  if (!Number.isSafeInteger(artJobId) || artJobId <= 0 || !agentId) {
    throw createError({
      statusCode: 400,
      message: 'ArtJob ID and agent ID required.',
    })
  }
  const artJob = await prisma.artJob.findFirst({
    where: {
      id: artJobId,
      projectSlug: 'coat-dance',
      engine: 'COMFY',
      status: 'RUNNING',
      claimedBy: agentId,
    },
  })
  if (!artJob || !isVideoRestyleArtJobPayload(artJob.payload)) {
    throw createError({
      statusCode: 409,
      message: 'Pilot is not claimed by this VACE relay.',
    })
  }
  const job = await loadRestyleJob(artJob.userId, id)
  const payload = parseArtJobPayload(artJob.payload)
  const restyle = payload.videoRestyle as Record<string, unknown> | undefined
  const phase = restyle?.phase === 'full' ? 'full' : 'pilot'
  const plan = phase === 'full' ? job.full : job.pilot
  const states =
    phase === 'full'
      ? ['FULL_QUEUED', 'FULL_RUNNING']
      : ['PILOT_QUEUED', 'PILOT_RUNNING']
  if (!plan || plan.artJobId !== artJobId || !states.includes(job.status)) {
    throw createError({
      statusCode: 409,
      message: 'Restyle job is not claimed in the expected render phase.',
    })
  }
  return { artJob, job, phase }
}
