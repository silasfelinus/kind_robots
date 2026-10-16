import { createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { isVideoRestyleArtJobPayload } from '@/utils/artJobMedia'
import { loadRestyleJob } from '@/server/utils/videoRestyleJobs'

export async function requireClaimedVacePilot(
  id: string,
  artJobId: number,
  agentId: string,
) {
  if (!Number.isSafeInteger(artJobId) || artJobId <= 0 || !agentId) {
    throw createError({ statusCode: 400, message: 'ArtJob ID and agent ID required.' })
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
    throw createError({ statusCode: 409, message: 'Pilot is not claimed by this VACE relay.' })
  }
  const job = await loadRestyleJob(artJob.userId, id)
  if (!job.pilot || job.pilot.artJobId !== artJobId) {
    throw createError({ statusCode: 409, message: 'Pilot manifest is not linked to this ArtJob.' })
  }
  if (!['PILOT_QUEUED', 'PILOT_RUNNING'].includes(job.status)) {
    throw createError({ statusCode: 409, message: 'Pilot is not in a renderable state.' })
  }
  return { artJob, job }
}
