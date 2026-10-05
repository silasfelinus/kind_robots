// /server/utils/comicStudioImportApply.ts
//
// Applies a validated Comic Studio import (utils/comicStudioImport.ts). Fill-only:
// it creates what is missing and fills empty series fields, and never overwrites
// anything edited in the studio, so re-running an import is safe. Each attempt is
// checked against its own ArtJob: the prompt, size and status come from the job, a
// ledger row that names the wrong request id or the wrong lane is skipped.
import prisma from '@/server/utils/prisma'
import type { ComicImportResult } from '~/types/comicStudio'
import {
  DEFAULT_COMIC_LANES,
  normalizeComicLanes,
  parseComicLanes,
} from '~/utils/comicLanes'
import { addComicPage, emptyComicIssueLayout } from '~/utils/comicLayouts'
import {
  isComicActiveStatus,
  oneOf,
  COMIC_ATTEMPT_STATUSES,
} from '~/utils/comicStudio'
import {
  comicJobRequestId,
  detectComicLaneForJob,
  type ComicImportPayload,
} from '~/utils/comicStudioImport'

function parsePayload(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

function numberOrNull(value: unknown): number | null {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

export async function applyComicImport(
  payload: ComicImportPayload,
  userId: number,
): Promise<ComicImportResult> {
  const skipped: string[] = []
  const errors: string[] = []
  const created = { entities: 0, slots: 0, attempts: 0 }

  const providedLanes =
    payload.series.lanes !== undefined
      ? normalizeComicLanes(payload.series.lanes)
      : null
  if (providedLanes?.errors.length) errors.push(...providedLanes.errors)
  const laneJson = JSON.stringify(
    providedLanes?.lanes.length ? providedLanes.lanes : DEFAULT_COMIC_LANES,
  )

  let series = await prisma.comicSeries.findUnique({
    where: { slug: payload.series.slug },
  })
  if (!series) {
    series = await prisma.comicSeries.create({
      data: {
        userId,
        slug: payload.series.slug,
        title: payload.series.title || payload.series.slug,
        notes: payload.series.notes ?? null,
        styleProse: payload.series.styleProse ?? null,
        styleTags: payload.series.styleTags ?? null,
        negativeTags: payload.series.negativeTags ?? null,
        lanes: laneJson,
      },
    })
  } else {
    const fill: Record<string, string> = {}
    for (const key of [
      'notes',
      'styleProse',
      'styleTags',
      'negativeTags',
    ] as const) {
      const incoming = payload.series[key]
      if (incoming && !series[key]) fill[key] = incoming
    }
    if (Object.keys(fill).length) {
      series = await prisma.comicSeries.update({
        where: { id: series.id },
        data: fill,
      })
    }
  }
  const seriesId = series.id
  const lanes = parseComicLanes(series.lanes)

  const issue = await prisma.comicIssue.findFirst({
    where: { seriesId },
    orderBy: { number: 'asc' },
    select: { id: true, notes: true },
  })
  if (!issue) {
    await prisma.comicIssue.create({
      data: {
        seriesId,
        number: 1,
        title: 'Issue 1',
        notes: payload.issueNotes,
        layout: JSON.stringify(addComicPage(emptyComicIssueLayout(), 'splash')),
      },
    })
  } else if (payload.issueNotes && !issue.notes) {
    await prisma.comicIssue.update({
      where: { id: issue.id },
      data: { notes: payload.issueNotes },
    })
  }

  const entityIdByKey = new Map<string, number>()
  for (const row of await prisma.comicEntity.findMany({
    where: { seriesId },
    select: { id: true, key: true },
  })) {
    entityIdByKey.set(row.key, row.id)
  }
  for (const entity of payload.entities) {
    if (entityIdByKey.has(entity.key)) continue
    const row = await prisma.comicEntity.create({
      data: {
        seriesId,
        key: entity.key,
        kind: entity.kind,
        name: entity.name,
        notes: entity.notes ?? null,
        secretUntil: entity.secretUntil ?? null,
        sortOrder: entity.sortOrder ?? 0,
      },
    })
    entityIdByKey.set(entity.key, row.id)
    created.entities += 1
  }

  const slotIdByKey = new Map<string, number>()
  for (const row of await prisma.comicSlot.findMany({
    where: { seriesId },
    select: { id: true, key: true },
  })) {
    slotIdByKey.set(row.key, row.id)
  }
  for (const slot of payload.slots) {
    if (slotIdByKey.has(slot.key)) continue
    const row = await prisma.comicSlot.create({
      data: {
        seriesId,
        entityId: slot.entityKey
          ? (entityIdByKey.get(slot.entityKey) ?? null)
          : null,
        key: slot.key,
        kind: slot.kind ?? 'subject',
        title: slot.title,
        notes: slot.notes ?? null,
        aspect: slot.aspect ?? '1:1',
        promptProse: slot.promptProse ?? null,
        promptTags: slot.promptTags ?? null,
        negativePrompt: slot.negativePrompt ?? null,
        useSeriesStyle: slot.useSeriesStyle !== false,
        sortOrder: slot.sortOrder ?? 0,
      },
    })
    slotIdByKey.set(slot.key, row.id)
    created.slots += 1
  }

  const jobIds = payload.attempts.map((attempt) => attempt.artJobId)
  const [existing, jobs] = await Promise.all([
    prisma.comicAttempt.findMany({
      where: { artJobId: { in: jobIds } },
      select: { artJobId: true },
    }),
    prisma.artJob.findMany({
      where: { id: { in: jobIds } },
      select: {
        id: true,
        status: true,
        artImageId: true,
        error: true,
        payload: true,
        createdAt: true,
      },
    }),
  ])
  const claimed = new Set(existing.map((row) => row.artJobId))
  const jobById = new Map(jobs.map((job) => [job.id, job]))
  for (const attempt of payload.attempts) {
    const label = `${attempt.slotKey} / job ${attempt.artJobId}`
    if (claimed.has(attempt.artJobId)) {
      skipped.push(`${label}: already imported`)
      continue
    }
    const job = jobById.get(attempt.artJobId)
    const slotId = slotIdByKey.get(attempt.slotKey)
    if (!job || !slotId) {
      errors.push(`${label}: ${job ? 'unknown slot' : 'ArtJob not found'}`)
      continue
    }
    const jobPayload = parsePayload(job.payload)
    const requestId = comicJobRequestId(jobPayload)
    if (attempt.expectRequestId && requestId !== attempt.expectRequestId) {
      errors.push(
        `${label}: job belongs to ${requestId ?? 'no request id'}, expected ${attempt.expectRequestId}`,
      )
      continue
    }
    const detected = detectComicLaneForJob(
      lanes,
      jobPayload.workflow as Record<string, unknown>,
    )
    if (attempt.laneKey && detected && attempt.laneKey !== detected) {
      errors.push(
        `${label}: ledger says lane ${attempt.laneKey} but the job rendered on ${detected}`,
      )
      continue
    }
    const laneKey = attempt.laneKey || detected || 'unknown'
    const lane = lanes.find((item) => item.key === laneKey)
    const status = oneOf(COMIC_ATTEMPT_STATUSES, String(job.status), 'PENDING')
    await prisma.comicAttempt.create({
      data: {
        slotId,
        laneKey,
        engine: lane?.engine ?? 'krea2',
        checkpoint: lane?.checkpoint ?? null,
        prompt: String(jobPayload.promptString ?? '').slice(0, 60_000),
        negativePrompt:
          typeof jobPayload.negativePrompt === 'string'
            ? jobPayload.negativePrompt
            : null,
        width: numberOrNull(jobPayload.width),
        height: numberOrNull(jobPayload.height),
        artJobId: job.id,
        artImageId: job.artImageId,
        status,
        error:
          isComicActiveStatus(status) || status === 'DONE' ? null : job.error,
        verdict: attempt.verdict ?? 'none',
        source: 'import',
        createdAt: job.createdAt,
        meta: JSON.stringify({ requestId }),
      },
    })
    created.attempts += 1
  }

  return { seriesId, created, skipped, errors }
}
