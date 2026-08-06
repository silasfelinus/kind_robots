// /server/utils/artImageOffload.ts
//
// Move a finished ArtImage's bytes out of the database and onto the media
// share, in the request that finished it.
//
// THE PROBLEM THIS SOLVES. Every art path funnels through saveImage(), which
// writes the raw base64 into ArtImage.imageData — a LongText column. Nothing
// ever took it back out. As of 2026-08-05 that column held 6,775 rows and
// 6,123.2 MB, and every completed job added another. Pruning the backlog
// without closing this is bailing with the tap still running.
//
// exportPageBackdropArt.ts already does write → link, but only for one project
// slug and only when a human remembers to run it. This is the same operation
// performed automatically, for every completed image, wherever the share is
// reachable.
//
// WHERE IT ACTUALLY RUNS. Only when IMAGES_PATH is set. That is a deliberate
// opt-in rather than a probe of "is some directory writable", because the
// dangerous failure is the inverse: a serverless filesystem that accepts the
// write, vanishes at the end of the invocation, and leaves a row pointing at a
// file that no longer exists with its only copy already deleted. Vercel must
// never set IMAGES_PATH (docs/self-hosted-media.md), so on Vercel this is a
// no-op and behaviour is exactly what it is today.
//
// NEVER DESTROYS THE ONLY COPY. imageData is nulled only after the file has
// been written, read back off the filesystem, and hashed identical to what we
// wrote. Any failure anywhere returns "not offloaded" and leaves the row
// untouched — the bytes stay in the database and the existing export/prune
// scripts can still pick it up later. This is called for its side effect and
// must never throw into a request that has already succeeded.
import path from 'node:path'
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import prisma from './prisma'
import { resolveArtImageFilePath } from './artImageFilePath'
import type { EntityArtDb } from './entityArt'

// Matches exportPageBackdropArt.ts and file.get.ts: 82 measured 8.3x smaller
// than the source PNG with no visible artefacts at card size.
const WEBP_QUALITY = 82

// Clips are stored verbatim. sharp cannot decode them, and re-encoding a video
// to WebP would silently turn a clip into a still.
const VIDEO_TYPES = new Set(['mp4', 'webm', 'mov', 'mkv'])

export type OffloadResult = {
  offloaded: boolean
  imagePath?: string
  bytesFreed?: number
  reason?: string
  /** False when the image had no entity behind it and went to the landing zone. */
  filed?: boolean
}

/**
 * The share root, or null when this install has not opted in.
 *
 * Deliberately NOT getImageStorageRoot(), which falls back to `public/images`
 * under cwd. That fallback is right for reads and for scripts; using it here
 * would make an ephemeral serverless filesystem look like durable storage.
 */
function mediaShareRoot(): string | null {
  const configured = process.env.IMAGES_PATH?.trim()
  return configured ? path.resolve(configured) : null
}

function stripDataUrl(raw: string): string {
  const comma = raw.indexOf(',')
  return raw.startsWith('data:') && comma >= 0 ? raw.slice(comma + 1) : raw
}

function digest(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

/**
 * True when imagePath already points somewhere other than this row's own API
 * endpoint. A self-referential path is how a row says "read my base64", so it
 * does not count as already-offloaded.
 */
function hasExternalPath(imagePath: string | null, id: number): boolean {
  if (!imagePath || !imagePath.trim()) return false
  return !imagePath.includes(`/api/art/images/${id}/file`)
}

/**
 * The share root must ALREADY exist as a directory.
 *
 * Everything below uses `mkdir -p`, which would cheerfully materialise a
 * typo'd IMAGES_PATH — and then the backfill writes gigabytes into a brand new
 * empty directory on the wrong filesystem while nulling the database copies it
 * just "moved". Refusing to create the root is what makes a mistyped path a
 * no-op instead of a data-loss event. Subdirectories under a verified root are
 * still created normally.
 */
export async function mediaShareRootIsMounted(root: string): Promise<boolean> {
  try {
    return (await fs.stat(root)).isDirectory()
  } catch {
    return false
  }
}

export async function offloadArtImageBytes(
  artImageId: number,
): Promise<OffloadResult> {
  const root = mediaShareRoot()
  if (!root) return { offloaded: false, reason: 'IMAGES_PATH not set' }

  if (!(await mediaShareRootIsMounted(root))) {
    return {
      offloaded: false,
      reason: `IMAGES_PATH does not exist as a directory: ${root}`,
    }
  }

  if (!Number.isInteger(artImageId) || artImageId <= 0) {
    return { offloaded: false, reason: 'invalid ArtImage id' }
  }

  try {
    const image = await prisma.artImage.findUnique({
      where: { id: artImageId },
      select: {
        id: true,
        imageData: true,
        imagePath: true,
        fileType: true,
        path: true,
      },
    })

    if (!image) return { offloaded: false, reason: 'ArtImage not found' }
    if (!image.imageData?.trim()) {
      return { offloaded: false, reason: 'no stored bytes' }
    }
    if (hasExternalPath(image.imagePath, image.id)) {
      return { offloaded: false, reason: `already at ${image.imagePath}` }
    }

    const original = Buffer.from(stripDataUrl(image.imageData), 'base64')
    if (!original.length) {
      return { offloaded: false, reason: 'stored base64 did not decode' }
    }

    const storedType = (image.fileType || 'png').toLowerCase()
    const isVideo = VIDEO_TYPES.has(storedType)
    const extension = isVideo ? storedType : 'webp'

    const bytes = isVideo
      ? original
      : await sharp(original).webp({ quality: WEBP_QUALITY }).toBuffer()

    /*
     * The destination follows conductor's URL-MAPPING.md convention —
     * /images/{context}/{slug}/{slug}-{utility}-{n}.webp — resolved from the
     * entity tag this image already carries. See artImageFilePath.ts.
     *
     * Silas, 2026-08-06: "we can't just rewrite everything as
     * art-image-2846.webp and expect that to be good enough." An id-keyed flat
     * name is only correct for art nothing has claimed, which is exactly what
     * the resolver falls back to.
     */
    const placement = await resolveArtImageFilePath(
      prisma as unknown as EntityArtDb,
      { id: image.id, path: image.path },
      extension,
      root,
      digest(bytes).slice(0, 8),
    )
    const relative = placement.relative
    const absolute = path.join(root, relative)

    await fs.mkdir(path.dirname(absolute), { recursive: true })
    await fs.writeFile(absolute, bytes)

    /*
     * Read it back before deleting anything. A write that "succeeded" onto an
     * unmounted share, a full disk, or a path that silently resolved somewhere
     * else is the one failure mode that would cost the only copy — so the file
     * has to prove it exists and matches before the database copy goes.
     */
    const readBack = await fs.readFile(absolute)
    if (digest(readBack) !== digest(bytes)) {
      return { offloaded: false, reason: 'file read back did not match' }
    }

    const servedPath = `/images/${relative}`

    /*
     * Row-specific and conditional, matching pruneRedundantArtImageData.ts: the
     * update applies only while imageData is still the value we decoded, so a
     * concurrent write to the same row loses the race instead of being
     * clobbered.
     */
    const result = await prisma.artImage.updateMany({
      where: { id: image.id, imageData: image.imageData },
      data: {
        imagePath: servedPath,
        imageData: null,
        ...(isVideo ? {} : { fileType: 'webp' }),
      },
    })

    if (result.count !== 1) {
      return { offloaded: false, reason: 'row changed during offload' }
    }

    return {
      offloaded: true,
      imagePath: servedPath,
      bytesFreed: image.imageData.length,
      filed: placement.filed,
    }
  } catch (error: unknown) {
    /*
     * Swallowed on purpose. This runs after the caller's real work has already
     * committed; throwing here would turn a successful generation into a 500
     * and lose the job. Failing to offload just means the bytes stay in the
     * database, which is exactly where they were before.
     */
    const message = error instanceof Error ? error.message : String(error)
    console.error(
      `❌ ArtImage ${artImageId} offload failed, bytes kept in database: ${message}`,
    )
    return { offloaded: false, reason: message.slice(0, 200) }
  }
}
