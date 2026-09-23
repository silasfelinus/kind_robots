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
import { splitHalfStepCfg } from '@/server/utils/artArchiveIntColumns'
import prisma from '@/server/utils/prisma'

const DEFAULT_BATCH_LIMIT = 500
const MAX_BATCH_LIMIT = 2000

function resolveLimit(raw: unknown): number {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_BATCH_LIMIT
  return Math.min(Math.floor(parsed), MAX_BATCH_LIMIT)
}

/**
 * The generation values recoverable from one entry's stored metadata.
 *
 * BOTH fields, not just the seed. cfg was dropped for the same rows and for a
 * different reason -- CFG scale is a half step (12.5) and `cfg` is an Int
 * column, so ~55% of every batch lost it until the importer started using the
 * `cfgHalf` flag that was in the schema all along. That fix only helps NEW
 * imports; these ~19,000 rows still need the value put back.
 */
export type GenerationRecovery = {
  seed: number | null
  cfg: { cfg: number; cfgHalf: boolean } | null
  /** Why nothing came back, so a zero can be explained rather than guessed at. */
  reason: 'ok' | 'no-metadata' | 'not-png' | 'no-generation-block'
}

export function generationFromExtractedMetadata(
  raw: string | null,
): GenerationRecovery {
  if (!raw) return { seed: null, cfg: null, reason: 'no-metadata' }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { seed: null, cfg: null, reason: 'no-metadata' }
  }
  // The same shape check the importer used to read this metadata originally;
  // it returns null for anything unexpected, so a malformed row is skipped
  // rather than guessed at.
  const png = narrowToPngMetadata(
    parsed as Parameters<typeof narrowToPngMetadata>[0],
  )
  if (!png) return { seed: null, cfg: null, reason: 'not-png' }
  const source = png.a1111 ?? png.comfy
  // A PNG can carry text chunks and still hold no generation block at all --
  // a screenshot, a download, an image whose metadata was stripped. That is
  // the expected reason for an archive-wide zero, and it is not a failure.
  if (!source) return { seed: null, cfg: null, reason: 'no-generation-block' }
  return {
    seed: seedColumnOrNull(source.seed),
    cfg: splitHalfStepCfg(source.cfg),
    reason: 'ok',
  }
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
        incomplete: 0,
        seedsRecoverable: 0,
        cfgRecoverable: 0,
        applied: 0,
        stillUnknown: 0,
        noMetadataStored: 0,
        notPngOrUnsupported: 0,
        noGenerationBlock: 0,
      }
    }

    const nextCursor = entries[entries.length - 1]!.id
    const imageIds = entries.map((entry) => entry.artImageId as number)

    // Rows missing EITHER value. Selecting on seed alone would never even look
    // at a row whose seed stored fine but whose 12.5 cfg did not, and those are
    // a different set -- roughly half the batch each, overlapping but not equal.
    // A value that is already present is never rewritten, which is what makes
    // this safe to re-run and safe to interrupt.
    const incomplete = new Map(
      (
        await prisma.artImage.findMany({
          where: {
            id: { in: imageIds },
            OR: [{ seed: null }, { cfg: null }],
          },
          select: { id: true, seed: true, cfg: true },
        })
      ).map((image) => [image.id, image]),
    )

    let seedsRecoverable = 0
    let cfgRecoverable = 0
    let applied = 0
    let stillUnknown = 0
    // WHY a row yielded nothing, not just that it did. A bare "0 recoverable"
    // is indistinguishable from a broken parser, and the first full run
    // reported exactly that over 69,071 rows with no way to tell which it was.
    let noMetadataStored = 0
    let notPngOrUnsupported = 0
    let noGenerationBlock = 0
    let exampleSeed: number | null = null
    let exampleCfg: string | null = null

    for (const entry of entries) {
      const imageId = entry.artImageId as number
      const image = incomplete.get(imageId)
      if (!image) continue

      const found = generationFromExtractedMetadata(entry.extractedMetadata)
      if (found.reason === 'no-metadata') noMetadataStored += 1
      else if (found.reason === 'not-png') notPngOrUnsupported += 1
      else if (found.reason === 'no-generation-block') noGenerationBlock += 1
      const data: { seed?: number; cfg?: number; cfgHalf?: boolean } = {}

      if (image.seed === null && found.seed !== null) {
        data.seed = found.seed
        seedsRecoverable += 1
        if (exampleSeed === null) exampleSeed = found.seed
      }
      if (image.cfg === null && found.cfg !== null) {
        data.cfg = found.cfg.cfg
        data.cfgHalf = found.cfg.cfgHalf
        cfgRecoverable += 1
        if (exampleCfg === null) {
          exampleCfg = found.cfg.cfgHalf
            ? `${found.cfg.cfg}.5`
            : String(found.cfg.cfg)
        }
      }

      if (!Object.keys(data).length) {
        stillUnknown += 1
        continue
      }

      if (apply) {
        await prisma.artImage.update({ where: { id: imageId }, data })
        applied += 1
      }
    }

    return {
      success: true,
      done: entries.length < limit,
      cursor: nextCursor,
      scanned: entries.length,
      incomplete: incomplete.size,
      seedsRecoverable,
      cfgRecoverable,
      applied,
      stillUnknown,
      noMetadataStored,
      notPngOrUnsupported,
      noGenerationBlock,
      exampleSeed,
      exampleCfg,
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
