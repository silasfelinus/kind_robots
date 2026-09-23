// /server/api/admin/art-archive/backfill-seeds.post.ts
//
// Recover the seeds the signed column could not hold.
//
// Before 20260923060000_art_image_seed_unsigned, ArtImage.seed was a signed
// INT, so roughly half of every imported archive file lost its seed -- first
// by aborting the whole insert, then (once that was made non-fatal) by being
// stored as null. ~19,000 files were imported in that window.
//
// Nothing was actually lost: importArchiveFile writes the file's real metadata
// verbatim to ArchiveEntry.extractedMetadata, which is exactly why the importer
// dropped the value instead of clamping it. This reads it back and fills the
// column in.
//
// WHY THIS IS AN ENDPOINT AND NOT A SCRIPT
// ----------------------------------------
// It was first written as utils/scripts/backfillArchiveSeeds.ts, which can run
// in neither place it needs to (art-archive/t-041, 2026-09-23). The host
// checkout holds the deploy scripts and has no DATABASE_URL -- that lives in
// /config/kind-robots.env, which only the container reads -- and the runtime
// image copies .output, node_modules, package.json, prisma and scripts, but
// NOT utils/. So the script was unreachable from both sides:
//
//   Error: DATABASE_URL is missing
//
// The import already solved this: an admin endpoint driven by
// scripts/art-archive-ingest.sh, which IS shipped. Doing the same here means
// the backfill inherits that runner's token discovery, restart tolerance and
// progress reporting rather than growing its own.
//
// The import's resume shape applies too: the caller passes a cursor, the server
// returns the next one, and a stopped run simply continues -- nothing to
// corrupt, because a filled seed is never rewritten.
import { defineEventHandler, readBody } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { narrowToPngMetadata } from '@/server/utils/artArchiveMetadata'
import { seedColumnOrNull } from '@/server/utils/artImageSeedColumn'
import prisma from '@/server/utils/prisma'

const DEFAULT_BATCH_LIMIT = 500
const MAX_BATCH_LIMIT = 2000

function resolveLimit(raw: unknown): number {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_BATCH_LIMIT
  return Math.min(Math.floor(parsed), MAX_BATCH_LIMIT)
}

export function seedFromExtractedMetadata(raw: string | null): number | null {
  if (!raw) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  // The same shape check the importer used to read this metadata originally;
  // it returns null for anything unexpected, so a malformed row is skipped
  // rather than guessed at.
  const png = narrowToPngMetadata(
    parsed as Parameters<typeof narrowToPngMetadata>[0],
  )
  const source = png?.a1111 ?? png?.comfy
  return seedColumnOrNull(source?.seed)
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body = (await readBody(event).catch(() => ({}))) as {
      cursor?: unknown
      limit?: unknown
      apply?: unknown
    } | null

    const cursor = Number(body?.cursor)
    const startAfter = Number.isFinite(cursor) && cursor > 0 ? cursor : 0
    const limit = resolveLimit(body?.limit)
    // Dry run unless asked, so the first call reports the size of the job
    // before touching anything.
    const apply = body?.apply === true

    const entries = await prisma.archiveEntry.findMany({
      where: { id: { gt: startAfter }, artImageId: { not: null } },
      select: { id: true, artImageId: true, extractedMetadata: true },
      orderBy: { id: 'asc' },
      take: limit,
    })

    if (!entries.length) {
      return {
        success: true,
        done: true,
        cursor: startAfter,
        seedless: 0,
        recoverable: 0,
        applied: 0,
        stillUnknown: 0,
      }
    }

    const nextCursor = entries[entries.length - 1]!.id
    const imageIds = entries.map((entry) => entry.artImageId as number)

    // Only rows that actually lack a seed: a filled seed is never rewritten,
    // which is what makes this safe to re-run and safe to interrupt.
    const seedless = new Set(
      (
        await prisma.artImage.findMany({
          where: { id: { in: imageIds }, seed: null },
          select: { id: true },
        })
      ).map((image) => image.id),
    )

    let recoverable = 0
    let applied = 0
    let stillUnknown = 0
    let exampleSeed: number | null = null

    for (const entry of entries) {
      const imageId = entry.artImageId as number
      if (!seedless.has(imageId)) continue

      const seed = seedFromExtractedMetadata(entry.extractedMetadata)
      if (seed === null) {
        stillUnknown += 1
        continue
      }

      recoverable += 1
      if (exampleSeed === null) exampleSeed = seed
      if (apply) {
        await prisma.artImage.update({
          where: { id: imageId },
          data: { seed },
        })
        applied += 1
      }
    }

    return {
      success: true,
      done: entries.length < limit,
      cursor: nextCursor,
      scanned: entries.length,
      seedless: seedless.size,
      recoverable,
      applied,
      stillUnknown,
      exampleSeed,
      apply,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      statusCode,
      message: handled.message || 'Failed to backfill archive seeds.',
    }
  }
})
