// /server/utils/comicStudio.ts
//
// Comic Studio server helpers (comic-creator/t-013, t-014). Every render goes through
// POST /api/art/enqueue via event.$fetch, the same server-to-server path Music Video
// uses, so workflow building, mana, provenance and prompt warnings stay in one place.
// The attempt row is written BEFORE the enqueue call, so a refused or failed enqueue
// still leaves a visible FAILED attempt instead of an untracked render.
import { createError, getRouterParam, type H3Event } from 'h3'
import prisma from '@/server/utils/prisma'
import { galleryThumbnailUrl } from '@/server/utils/artGalleryArchiveMedia'
import type {
  ComicAttemptDto,
  ComicEntityDto,
  ComicIssueDto,
  ComicRenderOutcome,
  ComicSeriesDto,
  ComicSlotDto,
  ComicSnapshot,
} from '~/types/comicStudio'
import {
  buildComicLaneEnqueueBody,
  comicLaneQueueDecision,
  parseComicLanes,
  type ComicLane,
} from '~/utils/comicLanes'
import {
  comicLayoutAttemptIds,
  parseComicIssueLayout,
} from '~/utils/comicLayouts'
import { reconcileComicAttemptStatus } from '~/utils/comicStudio'

type EnqueueResponse = {
  success?: boolean
  message?: string
  data?: { jobId?: number; status?: string }
}

type SeriesRow = NonNullable<
  Awaited<ReturnType<typeof prisma.comicSeries.findUnique>>
>
type EntityRow = NonNullable<
  Awaited<ReturnType<typeof prisma.comicEntity.findUnique>>
>
type SlotRow = NonNullable<
  Awaited<ReturnType<typeof prisma.comicSlot.findUnique>>
>
type AttemptRow = NonNullable<
  Awaited<ReturnType<typeof prisma.comicAttempt.findUnique>>
>
type IssueRow = NonNullable<
  Awaited<ReturnType<typeof prisma.comicIssue.findUnique>>
>

const RECENT_FAILURE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

export function readComicId(event: H3Event, label = 'id'): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: `Invalid comic ${label}.` })
  }
  return id
}

export function parseLaneKeys(
  stored: string | null | undefined,
): string[] | null {
  if (!stored) return null
  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.map((key) => String(key)) : null
  } catch {
    return null
  }
}

export function toComicSeriesDto(row: SeriesRow): ComicSeriesDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    notes: row.notes,
    styleProse: row.styleProse,
    styleTags: row.styleTags,
    negativeTags: row.negativeTags,
    lanes: parseComicLanes(row.lanes),
    isPublicArt: row.isPublicArt,
    coverAttemptId: row.coverAttemptId,
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function toComicEntityDto(row: EntityRow): ComicEntityDto {
  return {
    id: row.id,
    key: row.key,
    kind: row.kind,
    name: row.name,
    notes: row.notes,
    secretUntil: row.secretUntil,
    sortOrder: row.sortOrder,
    portraitAttemptId: row.portraitAttemptId,
  }
}

export function toComicSlotDto(row: SlotRow): ComicSlotDto {
  return {
    id: row.id,
    entityId: row.entityId,
    issueId: row.issueId,
    key: row.key,
    kind: row.kind,
    title: row.title,
    notes: row.notes,
    aspect: row.aspect,
    promptProse: row.promptProse,
    promptTags: row.promptTags,
    negativePrompt: row.negativePrompt,
    useSeriesStyle: row.useSeriesStyle,
    laneKeys: parseLaneKeys(row.laneKeys),
    status: row.status,
    sortOrder: row.sortOrder,
  }
}

export function toComicIssueDto(row: IssueRow): ComicIssueDto {
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    notes: row.notes,
    layout: parseComicIssueLayout(row.layout),
    layoutVersion: row.layoutVersion,
  }
}

type ImageInfo = { id: number; imagePath: string | null }

export async function comicImageMap(
  artImageIds: number[],
): Promise<Map<number, ImageInfo>> {
  const ids = [
    ...new Set(artImageIds.filter((id) => Number.isInteger(id) && id > 0)),
  ]
  if (!ids.length) return new Map()
  const rows = await prisma.artImage.findMany({
    where: { id: { in: ids } },
    select: { id: true, imagePath: true },
  })
  return new Map(rows.map((row) => [row.id, row]))
}

export function comicAttemptUrls(
  artImageId: number | null,
  image: ImageInfo | undefined,
): { thumbUrl: string | null; fullUrl: string | null } {
  if (!artImageId) return { thumbUrl: null, fullUrl: null }
  const thumbUrl = galleryThumbnailUrl(artImageId)
  const path = image?.imagePath?.trim() || ''
  const fullUrl = path.startsWith('/images/') ? path : thumbUrl
  return { thumbUrl, fullUrl }
}

export function toComicAttemptDto(
  row: AttemptRow,
  images: Map<number, ImageInfo>,
): ComicAttemptDto {
  const urls = comicAttemptUrls(
    row.artImageId,
    row.artImageId ? images.get(row.artImageId) : undefined,
  )
  return {
    id: row.id,
    slotId: row.slotId,
    laneKey: row.laneKey,
    engine: row.engine,
    checkpoint: row.checkpoint,
    prompt: row.prompt,
    negativePrompt: row.negativePrompt,
    width: row.width,
    height: row.height,
    artJobId: row.artJobId,
    artImageId: row.artImageId,
    status: row.status,
    error: row.error,
    verdict: row.verdict,
    note: row.note,
    source: row.source,
    createdAt: row.createdAt.toISOString(),
    ...urls,
  }
}

export async function requireComicSeries(id: number): Promise<SeriesRow> {
  const series = await prisma.comicSeries.findUnique({ where: { id } })
  if (!series || series.isArchived) {
    throw createError({ statusCode: 404, message: 'Comic series not found.' })
  }
  return series
}

export async function requireComicSlot(
  id: number,
): Promise<SlotRow & { Series: SeriesRow }> {
  const slot = await prisma.comicSlot.findUnique({
    where: { id },
    include: { Series: true },
  })
  if (!slot || slot.isArchived || slot.Series.isArchived) {
    throw createError({ statusCode: 404, message: 'Comic slot not found.' })
  }
  return slot
}

export async function syncComicAttempts(where: {
  slotIds?: number[]
  seriesId?: number
}): Promise<AttemptRow[]> {
  const cutoff = new Date(Date.now() - RECENT_FAILURE_WINDOW_MS)
  const candidates = await prisma.comicAttempt.findMany({
    where: {
      ...(where.slotIds ? { slotId: { in: where.slotIds } } : {}),
      ...(where.seriesId ? { Slot: { seriesId: where.seriesId } } : {}),
      OR: [
        { status: { in: ['QUEUING', 'PENDING', 'RUNNING'] } },
        { status: 'DONE', artImageId: null },
        {
          status: { in: ['FAILED', 'CANCELLED'] },
          updatedAt: { gte: cutoff },
          artJobId: { not: null },
        },
      ],
    },
  })
  if (!candidates.length) return []
  const jobIds = candidates
    .map((row) => row.artJobId)
    .filter((id): id is number => Boolean(id))
  const jobs = jobIds.length
    ? await prisma.artJob.findMany({
        where: { id: { in: jobIds } },
        select: { id: true, status: true, artImageId: true, error: true },
      })
    : []
  const byId = new Map(jobs.map((job) => [job.id, job]))
  const changed: AttemptRow[] = []
  for (const row of candidates) {
    const job = row.artJobId ? (byId.get(row.artJobId) ?? null) : null
    const next = reconcileComicAttemptStatus(
      {
        status: row.status,
        artJobId: row.artJobId,
        artImageId: row.artImageId,
        createdAt: row.createdAt,
      },
      job
        ? {
            status: String(job.status),
            artImageId: job.artImageId,
            error: job.error,
          }
        : null,
    )
    if (!next) continue
    changed.push(
      await prisma.comicAttempt.update({
        where: { id: row.id },
        data: {
          status: next.status,
          artImageId: next.artImageId,
          error: next.error,
        },
      }),
    )
  }
  return changed
}

export async function loadComicSnapshot(
  seriesId: number,
): Promise<ComicSnapshot> {
  const series = await requireComicSeries(seriesId)
  await syncComicAttempts({ seriesId })
  const [entities, slots, issues] = await Promise.all([
    prisma.comicEntity.findMany({
      where: { seriesId, isArchived: false },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    }),
    prisma.comicSlot.findMany({
      where: { seriesId, isArchived: false },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    }),
    prisma.comicIssue.findMany({
      where: { seriesId, isArchived: false },
      orderBy: { number: 'asc' },
    }),
  ])
  const issueDtos = issues.map(toComicIssueDto)
  const referenced = new Set<number>()
  for (const issue of issueDtos)
    for (const id of comicLayoutAttemptIds(issue.layout)) referenced.add(id)
  for (const entity of entities)
    if (entity.portraitAttemptId) referenced.add(entity.portraitAttemptId)
  if (series.coverAttemptId) referenced.add(series.coverAttemptId)
  const attempts = await prisma.comicAttempt.findMany({
    where: {
      OR: [
        { slotId: { in: slots.map((slot) => slot.id) } },
        { id: { in: [...referenced] } },
      ],
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  })
  const images = await comicImageMap(attempts.map((row) => row.artImageId ?? 0))
  return {
    series: toComicSeriesDto(series),
    entities: entities.map(toComicEntityDto),
    slots: slots.map(toComicSlotDto),
    attempts: attempts.map((row) => toComicAttemptDto(row, images)),
    issues: issueDtos,
    syncedAt: new Date().toISOString(),
  }
}

export async function enqueueComicLane(
  event: H3Event,
  slot: SlotRow,
  series: SeriesRow,
  lane: ComicLane,
): Promise<ComicRenderOutcome> {
  const active = await prisma.comicAttempt.count({
    where: {
      slotId: slot.id,
      laneKey: lane.key,
      status: { in: ['QUEUING', 'PENDING', 'RUNNING'] },
    },
  })
  const decision = comicLaneQueueDecision(active)
  if (!decision.allowed) {
    return {
      laneKey: lane.key,
      attemptId: null,
      status: 'refused',
      message: decision.reason,
    }
  }
  const body = buildComicLaneEnqueueBody(lane, slot, series)
  if (!body.promptString) {
    return {
      laneKey: lane.key,
      attemptId: null,
      status: 'refused',
      message: 'This slot has no prompt yet.',
    }
  }
  const attempt = await prisma.comicAttempt.create({
    data: {
      slotId: slot.id,
      laneKey: lane.key,
      engine: lane.engine,
      checkpoint: body.checkpoint ?? null,
      prompt: body.promptString,
      negativePrompt: body.negativePrompt ?? null,
      width: body.width,
      height: body.height,
      status: 'QUEUING',
      source: 'studio',
    },
  })
  try {
    const response = await event.$fetch<EnqueueResponse, string>(
      '/api/art/enqueue',
      {
        method: 'POST',
        body,
      },
    )
    const jobId = Number(response?.data?.jobId)
    if (!response?.success || !Number.isInteger(jobId) || jobId <= 0) {
      const message =
        response?.message || 'Enqueue did not return an ArtJob id.'
      await prisma.comicAttempt.update({
        where: { id: attempt.id },
        data: { status: 'FAILED', error: message },
      })
      return {
        laneKey: lane.key,
        attemptId: attempt.id,
        status: 'failed',
        message,
      }
    }
    await prisma.comicAttempt.update({
      where: { id: attempt.id },
      data: {
        artJobId: jobId,
        status: String(response.data?.status || 'PENDING'),
      },
    })
    return {
      laneKey: lane.key,
      attemptId: attempt.id,
      status: 'queued',
      message: null,
    }
  } catch (error) {
    const data = (error as { data?: { message?: string } })?.data
    const message =
      data?.message ||
      (error instanceof Error ? error.message : 'Enqueue failed.')
    await prisma.comicAttempt.update({
      where: { id: attempt.id },
      data: { status: 'FAILED', error: message },
    })
    return {
      laneKey: lane.key,
      attemptId: attempt.id,
      status: 'failed',
      message,
    }
  }
}

export async function attemptDtosForSlots(
  slotIds: number[],
): Promise<ComicAttemptDto[]> {
  const rows = await prisma.comicAttempt.findMany({
    where: { slotId: { in: slotIds } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  })
  const images = await comicImageMap(rows.map((row) => row.artImageId ?? 0))
  return rows.map((row) => toComicAttemptDto(row, images))
}
