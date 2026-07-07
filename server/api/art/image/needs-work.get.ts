// /server/api/art/image/needs-work.get.ts
//
// Work queue for the relay-side parity job. Lists ArtImages that need one of the
// three phase-2 passes, one kind at a time so the relay can page cheaply
// (imageData/thumbnailData LongText are NEVER selected here — the relay fetches
// bytes per-image via /api/art/image/[id] only when it actually materializes).
//
//   ?kind=materialize  imageData present but no file path -> write a .webp
//   ?kind=png          path/fileType is PNG              -> convert to .webp
//   ?kind=thumbnail    no thumbnail yet (has a source)   -> generate one
//
// Cursor-paged by ascending id (?cursorId=), machine-auth, read-only.
import { defineEventHandler, getQuery, createError } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireMachineUser } from '~/server/utils/authGuard'

type WorkKind = 'materialize' | 'png' | 'thumbnail'

const DEFAULT_LIMIT = 200
const MAX_LIMIT = 1000

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

const blank = (f: 'imagePath' | 'path' | 'imageData' | 'thumbnailData' | 'thumbnailPath') => ({
  OR: [{ [f]: null }, { [f]: '' }],
})
const present = (f: 'imagePath' | 'path' | 'imageData') => ({
  AND: [{ [f]: { not: null } }, { [f]: { not: '' } }],
})

function whereFor(kind: WorkKind): Prisma.ArtImageWhereInput {
  if (kind === 'materialize') {
    // Bytes live only in the DB — needs a file written to disk.
    return { AND: [present('imageData'), blank('imagePath'), blank('path')] }
  }
  if (kind === 'png') {
    return {
      OR: [
        { fileType: 'png' },
        { imagePath: { endsWith: '.png' } },
        { path: { endsWith: '.png' } },
      ],
    }
  }
  // thumbnail: no thumbnail yet, but something to build one from.
  return {
    AND: [
      blank('thumbnailData'),
      blank('thumbnailPath'),
      { OR: [{ imagePath: { not: null } }, { path: { not: null } }, present('imageData')] },
    ],
  }
}

export default defineEventHandler(async (event) => {
  try {
    await requireMachineUser(event)

    const q = getQuery(event)
    const kind = String(q.kind || 'materialize') as WorkKind
    if (!['materialize', 'png', 'thumbnail'].includes(kind)) {
      throw createError({
        statusCode: 400,
        message: "kind must be one of: materialize, png, thumbnail.",
      })
    }
    const limit = clampInt(q.limit, DEFAULT_LIMIT, 1, MAX_LIMIT)
    const cursorId = clampInt(q.cursorId, 0, 0, Number.MAX_SAFE_INTEGER)

    const where: Prisma.ArtImageWhereInput = {
      ...whereFor(kind),
      ...(cursorId ? { id: { gt: cursorId } } : {}),
    }

    const items = await prisma.artImage.findMany({
      where,
      // No LongText columns here — keep the page light.
      select: { id: true, imagePath: true, path: true, fileType: true, userId: true },
      orderBy: { id: 'asc' },
      take: limit,
    })

    const done = items.length < limit
    const nextCursor = done ? null : (items[items.length - 1]?.id ?? null)

    return {
      success: true,
      message: `${items.length} image(s) need '${kind}'.${done ? ' (last page)' : ''}`,
      data: { kind, items, nextCursor, done },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to list images needing work.',
      statusCode,
    }
  }
})
