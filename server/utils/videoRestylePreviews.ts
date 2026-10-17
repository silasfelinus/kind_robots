import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'
import prisma from '@/server/utils/prisma'
import {
  RESTYLE_PREVIEW_CFG,
  RESTYLE_PREVIEW_ENGINE,
  RESTYLE_PREVIEW_HEIGHT,
  RESTYLE_PREVIEW_STEPS,
  RESTYLE_PREVIEW_WIDTH,
  RESTYLE_STYLES,
  restylePreviewPrompt,
  type RestylePreview,
  type RestyleStyleId,
} from '@/utils/videoRestylePlan'

const PROJECT_SLUG = 'coat-dance'
const CONTEXT_MARKER = '"restylePreview":{'
const LOOKUP_LIMIT = 1000

type PreviewContext = { styleId: string; fingerprint: string }

type PreviewJob = {
  id: number
  status: string
  artImageId: number | null
  error: string | null
  context: PreviewContext
}

type EnqueueResponse = {
  success?: boolean
  message?: string
  data?: { jobId?: number; status?: string }
}

export type RestylePreviewOutcome = {
  styleId: RestyleStyleId
  status: 'queued' | 'requeued' | 'skipped' | 'reused' | 'failed'
  artJobId: number | null
  reason?: string
}

export function restylePreviewBody(styleId: RestyleStyleId) {
  return {
    engine: RESTYLE_PREVIEW_ENGINE,
    promptString: restylePreviewPrompt(styleId),
    width: RESTYLE_PREVIEW_WIDTH,
    height: RESTYLE_PREVIEW_HEIGHT,
    steps: RESTYLE_PREVIEW_STEPS,
    cfg: RESTYLE_PREVIEW_CFG,
    isPublic: true,
    isMature: false,
    designer: 'Coat Dance',
    projectSlug: PROJECT_SLUG,
  }
}

export function restylePreviewFingerprint(styleId: RestyleStyleId): string {
  return createHash('sha256')
    .update(JSON.stringify(restylePreviewBody(styleId)))
    .digest('hex')
    .slice(0, 32)
}

function previewContext(payload: string): PreviewContext | null {
  try {
    const parsed = JSON.parse(payload) as { restylePreview?: unknown }
    const context = parsed.restylePreview as Partial<PreviewContext> | null
    if (
      context &&
      typeof context.styleId === 'string' &&
      typeof context.fingerprint === 'string'
    ) {
      return { styleId: context.styleId, fingerprint: context.fingerprint }
    }
  } catch {
    return null
  }
  return null
}

async function previewJobsByStyle(): Promise<Map<string, PreviewJob[]>> {
  const rows = await prisma.artJob.findMany({
    where: {
      projectSlug: PROJECT_SLUG,
      payload: { contains: CONTEXT_MARKER },
    },
    orderBy: { id: 'desc' },
    take: LOOKUP_LIMIT,
    select: {
      id: true,
      status: true,
      artImageId: true,
      error: true,
      payload: true,
    },
  })
  const byStyle = new Map<string, PreviewJob[]>()
  for (const row of rows) {
    const context = previewContext(row.payload)
    if (!context) continue
    const list = byStyle.get(context.styleId) ?? []
    list.push({
      id: row.id,
      status: row.status,
      artImageId: row.artImageId,
      error: row.error,
      context,
    })
    byStyle.set(context.styleId, list)
  }
  return byStyle
}

function isActiveStatus(status: string): boolean {
  return status === 'PENDING' || status === 'RUNNING'
}

function describePreview(
  styleId: RestyleStyleId,
  jobs: PreviewJob[],
): RestylePreview {
  const latest = jobs[0]
  const shown = jobs.find((job) => job.status === 'DONE' && job.artImageId)
  const artImageId = shown?.artImageId ?? null
  const state = !latest
    ? 'MISSING'
    : latest.status === 'PENDING'
      ? 'QUEUED'
      : latest.status === 'RUNNING'
        ? 'RENDERING'
        : latest.status === 'DONE' && latest.artImageId
          ? 'READY'
          : 'FAILED'
  return {
    styleId,
    state,
    artJobId: latest?.id ?? null,
    artImageId,
    imageUrl: artImageId ? `/api/art/images/${artImageId}/file` : null,
    stale: Boolean(
      latest &&
      latest.context.fingerprint !== restylePreviewFingerprint(styleId),
    ),
    error:
      state === 'FAILED' ? latest?.error || 'Preview render failed.' : null,
  }
}

export async function listRestylePreviews(): Promise<RestylePreview[]> {
  const byStyle = await previewJobsByStyle()
  return RESTYLE_STYLES.map((style) =>
    describePreview(style.id, byStyle.get(style.id) ?? []),
  )
}

export async function queueRestylePreviews(
  event: H3Event,
  styleIds: RestyleStyleId[],
  force: boolean,
): Promise<RestylePreviewOutcome[]> {
  const byStyle = await previewJobsByStyle()
  const outcomes: RestylePreviewOutcome[] = []
  for (const styleId of styleIds) {
    const fingerprint = restylePreviewFingerprint(styleId)
    const latest = byStyle.get(styleId)?.[0]
    if (latest && isActiveStatus(latest.status)) {
      outcomes.push({
        styleId,
        status: 'skipped',
        artJobId: latest.id,
        reason: latest.status,
      })
      continue
    }
    if (
      latest?.status === 'DONE' &&
      latest.context.fingerprint === fingerprint &&
      !force
    ) {
      outcomes.push({ styleId, status: 'reused', artJobId: latest.id })
      continue
    }
    if (
      (latest?.status === 'FAILED' || latest?.status === 'CANCELLED') &&
      latest.context.fingerprint === fingerprint
    ) {
      outcomes.push(await requeuePreview(event, styleId, latest.id))
      continue
    }
    outcomes.push(await enqueuePreview(event, styleId, fingerprint))
  }
  return outcomes
}

async function requeuePreview(
  event: H3Event,
  styleId: RestyleStyleId,
  artJobId: number,
): Promise<RestylePreviewOutcome> {
  const response = await event.$fetch<EnqueueResponse, string>(
    `/api/art/queue/${artJobId}/requeue`,
    { method: 'POST', body: {} },
  )
  return response?.success
    ? { styleId, status: 'requeued', artJobId }
    : {
        styleId,
        status: 'failed',
        artJobId,
        reason: response?.message || 'The failed preview could not be retried.',
      }
}

async function enqueuePreview(
  event: H3Event,
  styleId: RestyleStyleId,
  fingerprint: string,
): Promise<RestylePreviewOutcome> {
  const response = await event.$fetch<EnqueueResponse, string>(
    '/api/art/enqueue',
    { method: 'POST', body: restylePreviewBody(styleId) },
  )
  const jobId = Number(response?.data?.jobId)
  if (!response?.success || !Number.isInteger(jobId) || jobId <= 0) {
    return {
      styleId,
      status: 'failed',
      artJobId: null,
      reason: response?.message || 'Enqueue did not return a valid ArtJob id.',
    }
  }
  const created = await prisma.artJob.findUnique({
    where: { id: jobId },
    select: { payload: true },
  })
  if (created) {
    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(created.payload) as Record<string, unknown>
    } catch {
      payload = {}
    }
    const restylePreview: PreviewContext = { styleId, fingerprint }
    await prisma.artJob.update({
      where: { id: jobId },
      data: { payload: JSON.stringify({ ...payload, restylePreview }) },
    })
  }
  return { styleId, status: 'queued', artJobId: jobId }
}
