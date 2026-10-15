import { randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createError } from 'h3'
import { getArtArchiveRoot } from '@/server/utils/artArchiveRoot'
import {
  RESTYLE_MAX_BYTES,
  RESTYLE_MAX_DURATION_SEC,
  RESTYLE_STYLES,
  isRestyleStyle,
  planRestyleSegments,
  type RestyleQuality,
  type RestyleSegment,
  type RestyleStatus,
  type RestyleStyleId,
} from '@/utils/videoRestylePlan'

export type VideoRestyleJob = {
  id: string
  userId: number
  title: string
  sourceFile: string
  sourceBytes: number
  sourceDurationSec: number
  sourceDurationProvenance: 'browser-unverified'
  style: RestyleStyleId
  quality: RestyleQuality
  status: RestyleStatus
  stage: string
  progress: number
  createdAt: string
  updatedAt: string
  segments: RestyleSegment[]
  error: string | null
  resultFile: string | null
  renderRecipe: {
    engine: 'wan-vace-proposed'
    poseControl: true
    depthControl: true
    preserveCamera: true
    preserveAudio: true
    outputFps: 24
    upscaleAfterAssembly: boolean
    stylePrompt: string
  }
}

const SAFE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function root(userId: number): string {
  return path.join(getArtArchiveRoot(), 'video-restyle', String(userId))
}

export function restyleSourcePath(job: VideoRestyleJob): string {
  return path.join(root(job.userId), job.id, job.sourceFile)
}

export async function loadRestyleJob(
  userId: number,
  id: string,
): Promise<VideoRestyleJob> {
  if (!SAFE_ID.test(id))
    throw createError({ statusCode: 404, message: 'Restyle not found.' })
  try {
    const content = await readFile(
      path.join(root(userId), id, 'job.json'),
      'utf8',
    )
    const job = JSON.parse(content) as VideoRestyleJob
    if (job.userId !== userId || job.id !== id)
      throw new Error('Invalid job ownership.')
    return job
  } catch {
    throw createError({ statusCode: 404, message: 'Restyle not found.' })
  }
}

export async function listRestyleJobs(
  userId: number,
): Promise<VideoRestyleJob[]> {
  let names: string[]
  try {
    names = await readdir(root(userId))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
  const results = await Promise.all(
    names
      .filter((name) => SAFE_ID.test(name))
      .map((id) => loadRestyleJob(userId, id).catch(() => null)),
  )
  return results
    .filter((job): job is VideoRestyleJob => Boolean(job))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 100)
}

function sourceFormat(bytes: Buffer): 'mp4' | 'mov' | 'webm' | null {
  if (bytes.length >= 12 && bytes.toString('ascii', 4, 8) === 'ftyp') {
    return bytes.toString('ascii', 8, 12).startsWith('qt') ? 'mov' : 'mp4'
  }
  if (bytes.length >= 4 && bytes.readUInt32BE(0) === 0x1a45dfa3) return 'webm'
  return null
}

export async function stageRestyleVideo(input: {
  userId: number
  data: Buffer
  title: unknown
  style: unknown
  quality: unknown
  durationSec: unknown
}): Promise<VideoRestyleJob> {
  if (!input.data.length || input.data.length > RESTYLE_MAX_BYTES) {
    throw createError({
      statusCode: 413,
      message: 'Upload must be a video under 128 MiB.',
    })
  }
  const format = sourceFormat(input.data)
  if (!format)
    throw createError({
      statusCode: 415,
      message: 'Upload an MP4, MOV or WebM video.',
    })
  if (!isRestyleStyle(input.style))
    throw createError({ statusCode: 400, message: 'Unknown animation style.' })
  if (input.quality !== '720p' && input.quality !== '1080p') {
    throw createError({ statusCode: 400, message: 'Choose 720p or 1080p.' })
  }
  const duration = Number(input.durationSec)
  if (
    !Number.isFinite(duration) ||
    duration < 1 ||
    duration > RESTYLE_MAX_DURATION_SEC
  ) {
    throw createError({
      statusCode: 400,
      message: 'Video must be between 1 second and 15 minutes.',
    })
  }
  const id = randomUUID()
  const directory = path.join(root(input.userId), id)
  await mkdir(directory, { recursive: true, mode: 0o700 })
  const now = new Date().toISOString()
  const style = RESTYLE_STYLES.find(
    (candidate) => candidate.id === input.style,
  )!
  const file = `source.${format}`
  const job: VideoRestyleJob = {
    id,
    userId: input.userId,
    title:
      String(input.title || 'Untitled performance')
        .trim()
        .slice(0, 120) || 'Untitled performance',
    sourceFile: file,
    sourceBytes: input.data.length,
    sourceDurationSec: duration,
    sourceDurationProvenance: 'browser-unverified',
    style: input.style,
    quality: input.quality,
    status: 'STAGED',
    stage: 'Waiting for a motion-conditioned render worker',
    progress: 0,
    createdAt: now,
    updatedAt: now,
    segments: planRestyleSegments(duration),
    error: null,
    resultFile: null,
    renderRecipe: {
      engine: 'wan-vace-proposed',
      poseControl: true,
      depthControl: true,
      preserveCamera: true,
      preserveAudio: true,
      outputFps: 24,
      upscaleAfterAssembly: input.quality === '1080p',
      stylePrompt: style.prompt,
    },
  }
  await writeFile(path.join(directory, file), input.data, {
    flag: 'wx',
    mode: 0o600,
  })
  await writeFile(
    path.join(directory, 'job.json'),
    JSON.stringify(job, null, 2),
    { flag: 'wx', mode: 0o600 },
  )
  return job
}

export async function updateRestyleSettings(
  userId: number,
  id: string,
  styleId: unknown,
  quality: unknown,
): Promise<VideoRestyleJob> {
  if (!isRestyleStyle(styleId)) {
    throw createError({ statusCode: 400, message: 'Unknown animation style.' })
  }
  if (quality !== '720p' && quality !== '1080p') {
    throw createError({ statusCode: 400, message: 'Choose 720p or 1080p.' })
  }
  const job = await loadRestyleJob(userId, id)
  if (job.status !== 'STAGED') {
    throw createError({
      statusCode: 409,
      message:
        'Rendering has already started; these settings can no longer be changed.',
    })
  }
  const style = RESTYLE_STYLES.find((entry) => entry.id === styleId)!
  const updated: VideoRestyleJob = {
    ...job,
    style: styleId,
    quality,
    updatedAt: new Date().toISOString(),
    renderRecipe: {
      ...job.renderRecipe,
      upscaleAfterAssembly: quality === '1080p',
      stylePrompt: style.prompt,
    },
  }
  const target = path.join(root(userId), id, 'job.json')
  const temporary = `${target}.${randomUUID()}.tmp`
  await writeFile(temporary, JSON.stringify(updated, null, 2), {
    flag: 'wx',
    mode: 0o600,
  })
  await rename(temporary, target)
  return updated
}
