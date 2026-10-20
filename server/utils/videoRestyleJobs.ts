import { randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises'
import path from 'node:path'
import { createError } from 'h3'
import { getArtArchiveRoot } from '@/server/utils/artArchiveRoot'
import {
  RESTYLE_MAX_BYTES,
  RESTYLE_DEFAULT_OVERWRITE_STRENGTH,
  RESTYLE_GRAB_BAG,
  RESTYLE_GRAB_BAG_MAX_STYLES,
  RESTYLE_GRAB_BAG_MIN_STYLES,
  RESTYLE_MAX_DURATION_SEC,
  RESTYLE_STYLES,
  isRestyleLook,
  isRestyleOverwriteStrength,
  isRestyleRenderSpeed,
  normalizeGrabBagStyles,
  planRestyleSegments,
  planRestyleStyleSchedule,
  restyleLookLabel,
  restyleRenderWindowCount,
  type RestyleLookId,
  type RestyleQuality,
  type RestyleRenderSpeed,
  type RestyleSegment,
  type RestyleStatus,
  type RestyleStyleId,
  type RestyleStyleWindow,
  type RestyleVariantMode,
} from '@/utils/videoRestylePlan'

export type VideoRestyleJob = {
  id: string
  userId: number
  title: string
  sourceFile: string
  sourceBytes: number
  sourceDurationSec: number
  sourceDurationProvenance: 'browser-unverified'
  style: RestyleLookId
  variantStyleIds?: RestyleStyleId[]
  variantMode?: RestyleVariantMode
  quality: RestyleQuality
  renderSpeed?: RestyleRenderSpeed
  overwriteStrength?: number
  isPrivate?: boolean
  isMature?: boolean
  sourceProjectId?: string
  status: RestyleStatus
  stage: string
  progress: number
  full?: {
    startSec: number
    durationSec: number
    completedSegments: number
    totalSegments: number
    artJobId?: number
    renderModel: string
    styleSchedule?: RestyleStyleWindow[]
  }
  pilot?: {
    startSec: number
    durationSec: number
    completedSegments: number
    totalSegments: number
    artJobId?: number
    revision?: number
    previousRevision?: number
    renderModel: string
    styleSchedule?: RestyleStyleWindow[]
  }
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

type ResolvedLook = {
  style: RestyleLookId
  variantStyleIds?: RestyleStyleId[]
  variantMode?: RestyleVariantMode
  stylePrompt: string
}

/** Validate a single look, or a Grab bag with its locked rotation order. */
export function resolveRestyleLook(
  style: unknown,
  variantStyleIds?: unknown,
  variantMode?: unknown,
): ResolvedLook {
  if (!isRestyleLook(style)) {
    throw createError({ statusCode: 400, message: 'Unknown animation style.' })
  }
  if (style !== RESTYLE_GRAB_BAG.id) {
    const look = RESTYLE_STYLES.find((entry) => entry.id === style)!
    return { style, stylePrompt: look.prompt }
  }
  const styleIds = normalizeGrabBagStyles(variantStyleIds)
  if (!styleIds) {
    throw createError({
      statusCode: 400,
      message: `Grab bag needs ${RESTYLE_GRAB_BAG_MIN_STYLES}-${RESTYLE_GRAB_BAG_MAX_STYLES} different looks.`,
    })
  }
  if (
    variantMode !== undefined &&
    variantMode !== 'cycle' &&
    variantMode !== 'shuffle_locked'
  ) {
    throw createError({ statusCode: 400, message: 'Unknown grab bag order.' })
  }
  return {
    style,
    variantStyleIds: styleIds,
    variantMode: variantMode ?? 'cycle',
    stylePrompt: `Grab bag rotation, one look per motion window: ${styleIds.map(restyleLookLabel).join(' -> ')}`,
  }
}

function lookFields(look: ResolvedLook) {
  return {
    style: look.style,
    variantStyleIds: look.variantStyleIds,
    variantMode: look.variantMode,
  }
}

function passSchedule(
  job: VideoRestyleJob,
  startSec: number,
  durationSec: number,
): { styleSchedule?: RestyleStyleWindow[] } {
  if (job.style !== RESTYLE_GRAB_BAG.id || !job.variantStyleIds?.length)
    return {}
  return {
    styleSchedule: planRestyleStyleSchedule(
      startSec,
      durationSec,
      job.variantStyleIds,
    ),
  }
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
  variantStyleIds?: unknown
  variantMode?: unknown
  renderSpeed?: unknown
  overwriteStrength?: unknown
  isPrivate?: unknown
  isMature?: unknown
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
  const look = resolveRestyleLook(
    input.style,
    input.variantStyleIds,
    input.variantMode,
  )
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
    ...lookFields(look),
    quality: input.quality,
    renderSpeed: restyleSpeed(input.renderSpeed, 'standard'),
    overwriteStrength: restyleOverwriteStrength(
      input.overwriteStrength,
      RESTYLE_DEFAULT_OVERWRITE_STRENGTH,
    ),
    isPrivate: restyleFlag(input.isPrivate, true),
    isMature: restyleFlag(input.isMature, false),
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
      stylePrompt: look.stylePrompt,
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

export function restyleOverwriteStrength(
  value: unknown,
  fallback: number,
): number {
  if (value === undefined || value === null || value === '') return fallback
  const numeric =
    typeof value === 'string' && value.trim() !== '' ? Number(value) : value
  if (isRestyleOverwriteStrength(numeric)) return numeric
  throw createError({
    statusCode: 400,
    message: 'Overwrite strength must be a whole number from 0 to 100.',
  })
}

/** Projects saved before Fast draft existed render at standard speed. */
function restyleSpeed(
  value: unknown,
  fallback: RestyleRenderSpeed,
): RestyleRenderSpeed {
  if (value === undefined || value === null || value === '') return fallback
  if (isRestyleRenderSpeed(value)) return value
  throw createError({ statusCode: 400, message: 'Unknown render speed.' })
}

function restyleFlag(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === null) return fallback
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  throw createError({
    statusCode: 400,
    message: 'Invalid video privacy or maturity setting.',
  })
}

export async function cloneRestyleVideo(input: {
  userId: number
  id: string
  title: unknown
  style: unknown
  quality: unknown
  variantStyleIds?: unknown
  variantMode?: unknown
  renderSpeed?: unknown
  overwriteStrength?: unknown
  isPrivate?: unknown
  isMature?: unknown
}): Promise<VideoRestyleJob> {
  const source = await loadRestyleJob(input.userId, input.id)
  if (!/^source\.(mp4|mov|webm)$/.test(source.sourceFile)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid saved source file.',
    })
  }
  const look = resolveRestyleLook(
    input.style,
    input.variantStyleIds,
    input.variantMode,
  )
  if (input.quality !== '720p' && input.quality !== '1080p') {
    throw createError({ statusCode: 400, message: 'Choose 720p or 1080p.' })
  }
  const id = randomUUID()
  const folder = path.join(root(input.userId), id)
  const now = new Date().toISOString()
  const cloned: VideoRestyleJob = {
    ...source,
    id,
    title:
      String(input.title || `${source.title} · ${restyleLookLabel(look.style)}`)
        .trim()
        .slice(0, 120) || source.title,
    sourceProjectId: source.sourceProjectId ?? source.id,
    ...lookFields(look),
    quality: input.quality,
    renderSpeed: restyleSpeed(
      input.renderSpeed,
      source.renderSpeed ?? 'standard',
    ),
    overwriteStrength: restyleOverwriteStrength(
      input.overwriteStrength,
      source.overwriteStrength ?? RESTYLE_DEFAULT_OVERWRITE_STRENGTH,
    ),
    isPrivate: restyleFlag(input.isPrivate, source.isPrivate ?? true),
    isMature: restyleFlag(input.isMature, source.isMature ?? false),
    status: 'STAGED',
    stage: 'Saved source reused; ready to queue a new style pilot',
    progress: 0,
    pilot: undefined,
    full: undefined,
    resultFile: null,
    error: null,
    createdAt: now,
    updatedAt: now,
    renderRecipe: {
      ...source.renderRecipe,
      stylePrompt: look.stylePrompt,
      upscaleAfterAssembly: input.quality === '1080p',
    },
  }
  await mkdir(folder, { recursive: false, mode: 0o700 })
  try {
    await copyFile(
      restyleSourcePath(source),
      path.join(folder, source.sourceFile),
      constants.COPYFILE_EXCL,
    )
    await writeFile(
      path.join(folder, 'job.json'),
      JSON.stringify(cloned, null, 2),
      {
        flag: 'wx',
        mode: 0o600,
      },
    )
  } catch (error) {
    await rm(folder, { recursive: true, force: true })
    throw error
  }
  return cloned
}

export async function updateRestyleSettings(
  userId: number,
  id: string,
  styleId: unknown,
  quality: unknown,
  isPrivate?: unknown,
  isMature?: unknown,
  variantStyleIds?: unknown,
  variantMode?: unknown,
  renderSpeed?: unknown,
  overwriteStrength?: unknown,
): Promise<VideoRestyleJob> {
  const look = resolveRestyleLook(styleId, variantStyleIds, variantMode)
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
  const updated: VideoRestyleJob = {
    ...job,
    ...lookFields(look),
    quality,
    renderSpeed: restyleSpeed(renderSpeed, job.renderSpeed ?? 'standard'),
    overwriteStrength: restyleOverwriteStrength(
      overwriteStrength,
      job.overwriteStrength ?? RESTYLE_DEFAULT_OVERWRITE_STRENGTH,
    ),
    isPrivate: restyleFlag(isPrivate, job.isPrivate ?? true),
    isMature: restyleFlag(isMature, job.isMature ?? false),
    updatedAt: new Date().toISOString(),
    renderRecipe: {
      ...job.renderRecipe,
      upscaleAfterAssembly: quality === '1080p',
      stylePrompt: look.stylePrompt,
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

export async function queueRestylePilot(
  userId: number,
  id: string,
): Promise<VideoRestyleJob> {
  const job = await loadRestyleJob(userId, id)
  if (
    !['STAGED', 'PILOT_FAILED', 'PILOT_BLOCKED', 'REVIEW'].includes(job.status)
  ) {
    throw createError({
      statusCode: 409,
      message: 'Pilot is already queued or being rendered.',
    })
  }
  const priorRevision = job.pilot?.revision ?? 1
  if (job.status === 'REVIEW') {
    if (job.resultFile !== 'pilot.mp4') {
      throw createError({
        statusCode: 409,
        message: 'The current pilot result is missing.',
      })
    }
    const folder = path.dirname(restyleSourcePath(job))
    // Preserve the reviewed version, including when the next generation fails.
    // Never overwrite an existing archive with different bytes.
    await copyFile(
      path.join(folder, 'pilot.mp4'),
      path.join(folder, `pilot-v${priorRevision}.mp4`),
      constants.COPYFILE_EXCL,
    )
  }
  const startSec = job.sourceDurationSec >= 182 ? 158 : 0
  const durationSec = Math.min(24, job.sourceDurationSec - startSec)
  const updated: VideoRestyleJob = {
    ...job,
    status: 'PILOT_QUEUED',
    stage:
      '24-second motion-conditioned pilot queued for the external GPU worker',
    progress: 0,
    error: null,
    resultFile: null,
    pilot: {
      startSec,
      durationSec,
      revision: job.status === 'REVIEW' ? priorRevision + 1 : priorRevision,
      ...(job.status === 'REVIEW'
        ? { previousRevision: priorRevision }
        : job.pilot?.previousRevision
          ? { previousRevision: job.pilot.previousRevision }
          : {}),
      completedSegments: 0,
      totalSegments: restyleRenderWindowCount(durationSec),
      renderModel: 'wan2.1_vace_1.3B_fp16.safetensors',
      ...passSchedule(job, startSec, durationSec),
    },
    updatedAt: new Date().toISOString(),
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

const FULL_QUEUEABLE: RestyleStatus[] = [
  'STAGED',
  'PILOT_BLOCKED',
  'PILOT_FAILED',
  'REVIEW',
]

/** Queue the whole source in one batch; a pilot is optional, never required. */
export async function queueRestyleFull(
  userId: number,
  id: string,
): Promise<VideoRestyleJob> {
  const job = await loadRestyleJob(userId, id)
  if (!FULL_QUEUEABLE.includes(job.status)) {
    throw createError({
      statusCode: 409,
      message:
        'This project is already rendering; wait for it before queueing the full film.',
    })
  }
  if (job.full) {
    throw createError({
      statusCode: 409,
      message: 'A full-length job already exists for this project.',
    })
  }
  const durationSec = job.sourceDurationSec
  const totalSegments = restyleRenderWindowCount(durationSec)
  const updated: VideoRestyleJob = {
    ...job,
    status: 'FULL_QUEUED',
    stage: job.pilot
      ? 'Full-length render queued; pilot preserved for comparison'
      : 'Full-length render queued for KR Relay',
    progress: 0,
    error: null,
    resultFile: null,
    full: {
      startSec: 0,
      durationSec,
      completedSegments: 0,
      totalSegments,
      renderModel: 'wan2.1_vace_1.3B_fp16.safetensors',
      ...passSchedule(job, 0, durationSec),
    },
    updatedAt: new Date().toISOString(),
  }
  const target = path.join(root(userId), id, 'job.json')
  const temp = `${target}.${randomUUID()}.tmp`
  await writeFile(temp, JSON.stringify(updated, null, 2), {
    flag: 'wx',
    mode: 0o600,
  })
  await rename(temp, target)
  return updated
}

/** Rename saved projects without affecting their render status or settings. */
export async function renameRestyleProject(
  userId: number,
  id: string,
  title: unknown,
): Promise<VideoRestyleJob> {
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 120) {
    throw createError({
      statusCode: 400,
      message: 'Enter a project title (1–120 characters).',
    })
  }
  const job = await loadRestyleJob(userId, id)
  if (job.status === 'PILOT_RUNNING' || job.status === 'FULL_RUNNING') {
    throw createError({
      statusCode: 409,
      message: 'Rename this project after its current render finishes.',
    })
  }
  const updated = {
    ...job,
    title: title.trim(),
    updatedAt: new Date().toISOString(),
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
