import type { ArtJob } from '~/prisma/generated/prisma/client'
import { parseArtJobPayload } from './artJobPayload'

export type VideoGeneratorJobSummary = {
  id: number
  status: ArtJob['status']
  model: 'ltx' | 'wan'
  prompt: string
  createdAt: Date
  updatedAt: Date | null
  claimedAt: Date | null
  artImageId: number | null
  attempts: number
  error: string | null
  durationSeconds: number | null
  frames: number | null
  width: number | null
  height: number | null
  outputFormat: string | null
}

export function videoGeneratorMetadata(
  job: Pick<ArtJob, 'payload' | 'projectSlug'>,
): { model: 'ltx' | 'wan'; video: Record<string, unknown> } | null {
  if (job.projectSlug && job.projectSlug !== 'video-generator') return null
  const payload = parseArtJobPayload(job.payload)
  if (payload.media !== 'video') return null
  const video =
    payload.video &&
    typeof payload.video === 'object' &&
    !Array.isArray(payload.video)
      ? (payload.video as Record<string, unknown>)
      : {}
  if (video.model !== 'ltx' && video.model !== 'wan') return null
  return { model: video.model, video }
}

function validNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function summarizeVideoGeneratorJob(
  job: ArtJob,
): VideoGeneratorJobSummary | null {
  const metadata = videoGeneratorMetadata(job)
  if (!metadata) return null
  const payload = parseArtJobPayload(job.payload)
  return {
    id: job.id,
    status: job.status,
    model: metadata.model,
    prompt: String(payload.promptString || '').slice(0, 300),
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    claimedAt: job.claimedAt,
    artImageId: job.artImageId,
    attempts: job.attempts,
    error: job.error,
    durationSeconds: validNumber(metadata.video.durationSeconds),
    frames: validNumber(metadata.video.frames),
    width: validNumber(metadata.video.width),
    height: validNumber(metadata.video.height),
    outputFormat:
      typeof metadata.video.outputFormat === 'string'
        ? metadata.video.outputFormat
        : null,
  }
}
