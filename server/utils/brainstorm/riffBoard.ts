import type { H3Event } from 'h3'
import { createError } from 'h3'
import prisma from '~/server/utils/prisma'
import type { AuthUser } from '~/server/utils/authUser'
import {
  BRAINSTORM_FLAGS_TO_HIDE,
  BRAINSTORM_ORIGINAL_TABLE,
  BRAINSTORM_RIFF_STARTERS,
  buildLineArtPrompt,
  emptyReactionCounts,
  lineHeat,
  parseCrossoverIds,
  reactionPoints,
  type BrainstormLineReactionWithFlag,
  type BrainstormReactionCounts,
} from '~/utils/brainstormRiffs'

export const BRAINSTORM_PROJECT_SLUG = 'brainstorm'
const GUEST_USER_ID = 10

export type BrainstormArtStatus = 'ready' | 'painting' | 'failed' | 'none'

type RiffRow = {
  id: number
  createdAt: Date
  userId: number | null
  starterKey: string | null
  flavor: string
  title: string
  stem: string | null
  vibe: string | null
  crossoverIds: string | null
  isPublic: boolean
  isOpen: boolean
  lastLineAt: Date | null
}

type LineRow = {
  id: number
  createdAt: Date
  riffId: number
  userId: number | null
  authorName: string
  text: string
  aiSpark: string | null
  artJobId: number | null
  artImageId: number | null
}

export function requirePlayer(user: AuthUser | null | undefined): AuthUser {
  if (!user || user.id === GUEST_USER_ID || user.isGuest) {
    throw createError({
      statusCode: 401,
      message: 'Sign in to play Brainstorm.',
    })
  }
  return user
}

export function canSeeRiff(
  riff: Pick<RiffRow, 'isPublic' | 'userId'>,
  viewer: AuthUser | null,
): boolean {
  if (riff.isPublic) return true
  if (!viewer) return false
  return viewer.isAdmin || riff.userId === viewer.id
}

export function canModerateRiff(
  riff: Pick<RiffRow, 'userId'>,
  viewer: AuthUser | null,
): boolean {
  if (!viewer) return false
  return viewer.isAdmin || (riff.userId !== null && riff.userId === viewer.id)
}

export async function readRiffOr404(riffId: number): Promise<RiffRow> {
  const riff = await prisma.brainstormRiff.findUnique({ where: { id: riffId } })
  if (!riff) {
    throw createError({ statusCode: 404, message: 'That riff is gone.' })
  }
  return riff
}

export function parsePositiveId(value: unknown, label: string): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: `A valid ${label} is required.`,
    })
  }
  return id
}

let starterSeed: Promise<void> | null = null

async function seedStarters(): Promise<void> {
  const existing = await prisma.brainstormRiff.findMany({
    where: { starterKey: { in: BRAINSTORM_RIFF_STARTERS.map((s) => s.key) } },
    select: { id: true, starterKey: true },
  })
  const idByKey = new Map(
    existing.map((row) => [row.starterKey as string, row.id] as const),
  )

  for (const starter of BRAINSTORM_RIFF_STARTERS) {
    if (idByKey.has(starter.key)) continue
    const now = new Date()
    try {
      const created = await prisma.brainstormRiff.create({
        data: {
          starterKey: starter.key,
          flavor: starter.flavor,
          title: starter.title,
          stem: starter.stem ?? null,
          vibe: starter.vibe,
          isPublic: true,
          lastLineAt: starter.lines.length ? now : null,
          Lines: {
            create: starter.lines.map((text, index) => ({
              authorName: BRAINSTORM_ORIGINAL_TABLE,
              text,
              createdAt: new Date(
                now.getTime() - (starter.lines.length - index) * 1000,
              ),
            })),
          },
        },
        select: { id: true },
      })
      idByKey.set(starter.key, created.id)
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code !== 'P2002') throw error
    }
  }

  for (const starter of BRAINSTORM_RIFF_STARTERS) {
    if (!starter.crossoverKeys?.length) continue
    const id = idByKey.get(starter.key)
    const ids = starter.crossoverKeys
      .map((key) => idByKey.get(key))
      .filter((value): value is number => typeof value === 'number')
    if (!id || !ids.length) continue
    await prisma.brainstormRiff.updateMany({
      where: { id, crossoverIds: null },
      data: { crossoverIds: JSON.stringify(ids) },
    })
  }
}

export async function ensureStarterRiffs(): Promise<void> {
  if (!starterSeed) {
    starterSeed = seedStarters().catch((error) => {
      starterSeed = null
      throw error
    })
  }
  await starterSeed
}

async function reactionCountsFor(
  lineIds: number[],
): Promise<Map<number, BrainstormReactionCounts>> {
  const counts = new Map<number, BrainstormReactionCounts>()
  if (!lineIds.length) return counts
  const grouped = await prisma.reaction.groupBy({
    by: ['brainstormLineId', 'reactionType'],
    where: {
      reactionCategory: 'BRAINSTORM_LINE',
      brainstormLineId: { in: lineIds },
    },
    _count: { _all: true },
  })
  for (const row of grouped) {
    if (!row.brainstormLineId) continue
    const entry = counts.get(row.brainstormLineId) ?? emptyReactionCounts()
    const type = row.reactionType as BrainstormLineReactionWithFlag
    if (type in entry) entry[type] = row._count._all
    counts.set(row.brainstormLineId, entry)
  }
  return counts
}

async function resolveLineArt(
  lines: LineRow[],
): Promise<Map<number, BrainstormArtStatus>> {
  const status = new Map<number, BrainstormArtStatus>()
  const pending = lines.filter((line) => line.artJobId && !line.artImageId)
  for (const line of lines) {
    status.set(
      line.id,
      line.artImageId ? 'ready' : line.artJobId ? 'painting' : 'none',
    )
  }
  if (!pending.length) return status

  const jobs = await prisma.artJob.findMany({
    where: { id: { in: pending.map((line) => line.artJobId as number) } },
    select: { id: true, status: true, artImageId: true },
  })
  const jobById = new Map(jobs.map((job) => [job.id, job] as const))
  for (const line of pending) {
    const job = jobById.get(line.artJobId as number)
    if (!job || job.status === 'FAILED' || job.status === 'CANCELLED') {
      status.set(line.id, 'failed')
      continue
    }
    if (job.status === 'DONE' && job.artImageId) {
      line.artImageId = job.artImageId
      status.set(line.id, 'ready')
      await prisma.brainstormLine.update({
        where: { id: line.id },
        data: { artImageId: job.artImageId },
      })
      continue
    }
    if (job.status === 'DONE') status.set(line.id, 'failed')
  }
  return status
}

export function artUrl(artImageId: number | null | undefined): string | null {
  return artImageId ? `/api/art/images/${artImageId}/file` : null
}

function serializeRiff(riff: RiffRow, viewer: AuthUser | null) {
  return {
    id: riff.id,
    createdAt: riff.createdAt,
    flavor: riff.flavor,
    title: riff.title,
    stem: riff.stem,
    vibe: riff.vibe,
    starterKey: riff.starterKey,
    crossoverIds: parseCrossoverIds(riff.crossoverIds),
    isPublic: riff.isPublic,
    isOpen: riff.isOpen,
    lastLineAt: riff.lastLineAt,
    isMine: Boolean(viewer && riff.userId === viewer.id),
    canModerate: canModerateRiff(riff, viewer),
  }
}

export async function listRiffs(viewer: AuthUser | null) {
  await ensureStarterRiffs()
  const riffs = await prisma.brainstormRiff.findMany({
    where: viewer
      ? { OR: [{ isPublic: true }, { userId: viewer.id }] }
      : { isPublic: true },
    orderBy: [{ lastLineAt: 'desc' }, { createdAt: 'desc' }],
    take: 80,
  })
  const riffIds = riffs.map((riff) => riff.id)
  const lines = riffIds.length
    ? await prisma.brainstormLine.findMany({
        where: { riffId: { in: riffIds } },
        select: {
          id: true,
          riffId: true,
          text: true,
          artImageId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 3000,
      })
    : []
  const counts = await reactionCountsFor(lines.map((line) => line.id))
  const now = new Date()

  const cards = riffs.map((riff) => {
    const own = lines.filter((line) => line.riffId === riff.id)
    const scored = own
      .map((line) => {
        const lineCounts = counts.get(line.id) ?? emptyReactionCounts()
        return {
          line,
          points: reactionPoints(lineCounts),
          heat: lineHeat(lineCounts, line.createdAt, now),
          hidden: lineCounts.FLAGGED >= BRAINSTORM_FLAGS_TO_HIDE,
        }
      })
      .filter((entry) => !entry.hidden)
    const best = [...scored].sort((a, b) => b.points - a.points)[0]
    const cover =
      [...scored]
        .filter((entry) => entry.line.artImageId)
        .sort((a, b) => b.points - a.points)[0]?.line.artImageId ?? null
    return {
      ...serializeRiff(riff, viewer),
      lineCount: scored.length,
      points: scored.reduce((total, entry) => total + entry.points, 0),
      heat: scored.reduce((total, entry) => total + entry.heat, 0),
      bestLine: best
        ? { id: best.line.id, text: best.line.text, points: best.points }
        : null,
      coverUrl: artUrl(cover),
    }
  })

  cards.sort((a, b) => b.heat - a.heat || b.id - a.id)
  return cards
}

export async function loadRiffDetail(riffId: number, viewer: AuthUser | null) {
  const riff = await readRiffOr404(riffId)
  if (!canSeeRiff(riff, viewer)) {
    throw createError({ statusCode: 404, message: 'That riff is gone.' })
  }

  const lines = (await prisma.brainstormLine.findMany({
    where: { riffId },
    orderBy: { createdAt: 'desc' },
    take: 400,
  })) as LineRow[]
  const lineIds = lines.map((line) => line.id)
  const [counts, art, mine, crossovers] = await Promise.all([
    reactionCountsFor(lineIds),
    resolveLineArt(lines),
    viewer && lineIds.length
      ? prisma.reaction.findMany({
          where: {
            userId: viewer.id,
            reactionCategory: 'BRAINSTORM_LINE',
            brainstormLineId: { in: lineIds },
          },
          select: { brainstormLineId: true, reactionType: true },
        })
      : Promise.resolve([]),
    parseCrossoverIds(riff.crossoverIds).length
      ? prisma.brainstormRiff.findMany({
          where: {
            id: { in: parseCrossoverIds(riff.crossoverIds) },
            isPublic: true,
          },
          select: { id: true, title: true, stem: true, vibe: true },
        })
      : Promise.resolve([]),
  ])
  const mineByLine = new Map(
    mine.map(
      (row) => [row.brainstormLineId as number, row.reactionType] as const,
    ),
  )
  const moderator = canModerateRiff(riff, viewer)

  return {
    riff: { ...serializeRiff(riff, viewer), crossovers },
    lines: lines
      .map((line) => {
        const lineCounts = counts.get(line.id) ?? emptyReactionCounts()
        const hidden = lineCounts.FLAGGED >= BRAINSTORM_FLAGS_TO_HIDE
        return {
          id: line.id,
          createdAt: line.createdAt,
          authorName: line.authorName,
          text: line.text,
          aiSpark: line.aiSpark,
          counts: lineCounts,
          points: reactionPoints(lineCounts),
          myReaction: mineByLine.get(line.id) ?? null,
          artStatus: art.get(line.id) ?? 'none',
          artUrl: artUrl(line.artImageId),
          hidden,
          isMine: Boolean(viewer && line.userId === viewer.id),
          canDelete: Boolean(
            viewer &&
            (moderator || (line.userId !== null && line.userId === viewer.id)),
          ),
        }
      })
      .filter((line) => !line.hidden || moderator),
  }
}

type EnqueueResponse = {
  success?: boolean
  message?: string
  data?: { jobId?: number | string }
}

export async function enqueueLineArt(
  event: H3Event,
  riff: Pick<RiffRow, 'id' | 'title' | 'flavor' | 'stem'>,
  line: { id: number; text: string },
): Promise<{ jobId: number | null; message?: string }> {
  try {
    const response = await event.$fetch<EnqueueResponse, string>(
      '/api/art/enqueue',
      {
        method: 'POST',
        body: {
          engine: 'krea2',
          promptString: buildLineArtPrompt(riff, line.text),
          width: 1024,
          height: 1024,
          isPublic: true,
          isMature: false,
          designer: 'Brainstorm',
          projectSlug: BRAINSTORM_PROJECT_SLUG,
        },
      },
    )
    const jobId = Number(response?.data?.jobId)
    if (!response?.success || !Number.isInteger(jobId) || jobId <= 0) {
      return { jobId: null, message: response?.message || 'Art did not queue.' }
    }
    await prisma.brainstormLine.update({
      where: { id: line.id },
      data: { artJobId: jobId, artImageId: null },
    })
    return { jobId }
  } catch (error) {
    const data = (error as { data?: { message?: string } }).data
    return {
      jobId: null,
      message:
        data?.message || (error as Error).message || 'Art did not queue.',
    }
  }
}
