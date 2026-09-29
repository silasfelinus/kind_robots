// /server/utils/artImageThumbnail.ts
//
// One browser-loadable thumbnail for ANY ArtImage, whatever holds its pixels.
//
// An ArtImage's bytes live in one of three places: inline base64 `imageData`,
// a file under the public image root (`imagePath` -> /images/...), or the
// private Art Archive (designer 'art-archive'). The collection-first Gallery
// left the browser to work that out per tile -- a JSON refetch for inline rows,
// a guessed /images/<fileName> for some, a signed archive url for others -- so
// one bad source became a permanent "Retry" tile and a big collection opened as
// dozens of parallel full-image requests. The image feed instead hands every
// tile the same kind of url, and this resolves it server-side into a small
// cached WebP, using the archive's own bounded generation slot.
import os from 'node:os'
import path from 'node:path'
import {
  mkdir,
  readFile,
  realpath,
  rename,
  stat,
  writeFile,
} from 'node:fs/promises'
import { createError } from 'h3'
import sharp from 'sharp'
import { resolveConfinedExistingPath } from './artArchiveFileOps'
import { withGenerationSlot } from './artArchiveThumbnails'
import { getImageStorageRoot } from './imageStorageRoot'

const THUMBNAIL_MAX_DIMENSION = 480
const THUMBNAIL_WEBP_QUALITY = 82

export type ThumbnailSourceRow = {
  id: number
  updatedAt: Date | null
  designer: string | null
  imagePath: string | null
  path: string | null
  fileName: string | null
  imageData: string | null
}

export type ResolvedThumbnail =
  { kind: 'bytes'; buffer: Buffer } | { kind: 'redirect'; url: string }

const inFlight = new Map<string, Promise<Buffer>>()

function thumbnailCacheRoot(): string {
  const configured = process.env.ART_THUMBNAIL_CACHE_PATH?.trim()
  return configured
    ? path.resolve(configured)
    : path.join(os.tmpdir(), 'kind-robots-art-thumbnails')
}

function isRemoteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

/**
 * The relative path under the public image root that a stored path points at,
 * or null when it names nothing there. Accepts the shapes rows actually hold:
 * `/images/x`, `images/x`, a same-site absolute url, and a bare file name.
 */
export function publicImageRelativePath(value?: string | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed || trimmed.startsWith('data:')) return null

  let pathname = trimmed
  if (isRemoteUrl(trimmed)) {
    try {
      pathname = new URL(trimmed).pathname
    } catch {
      return null
    }
  }

  pathname = pathname
    .replace(/^file:\/\//, '')
    .replace(/^\/?(app\/)?public\//, '/')
    .replace(/^\/mnt\/data\/+/, '/')

  const match = pathname.match(/^\/?images\/(.+)$/)
  if (match?.[1]) return decodeURIComponent(match[1])
  if (isRemoteUrl(trimmed) || pathname.includes('/')) return null
  return decodeURIComponent(pathname)
}

function decodeInlineImage(imageData?: string | null): Buffer | null {
  const raw = imageData?.trim()
  if (!raw) return null
  const payload = raw.startsWith('data:image/')
    ? raw.slice(raw.indexOf(',') + 1)
    : raw
  if (!/^[A-Za-z0-9+/=\s_-]+$/.test(payload.slice(0, 256))) return null
  const buffer = Buffer.from(payload, 'base64')
  return buffer.length > 32 ? buffer : null
}

async function cachedDerivative(
  cacheKey: string,
  loadSource: () => Promise<Buffer>,
): Promise<Buffer> {
  const cachePath = path.join(thumbnailCacheRoot(), `${cacheKey}.webp`)

  try {
    return await readFile(cachePath)
  } catch {
    // Not generated yet.
  }

  const pending = inFlight.get(cachePath)
  if (pending) return pending

  const generation = withGenerationSlot(async () => {
    const source = await loadSource()
    const derived = await sharp(source)
      .rotate()
      .resize(THUMBNAIL_MAX_DIMENSION, THUMBNAIL_MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: THUMBNAIL_WEBP_QUALITY })
      .toBuffer()

    await mkdir(path.dirname(cachePath), { recursive: true })
    const tempPath = `${cachePath}.${process.pid}.${Date.now()}.tmp`
    await writeFile(tempPath, derived)
    await rename(tempPath, cachePath)
    return derived
  }).finally(() => {
    inFlight.delete(cachePath)
  })
  inFlight.set(cachePath, generation)
  return generation
}

async function publicImageFile(relativePath: string): Promise<string | null> {
  try {
    const root = await realpath(getImageStorageRoot())
    const resolved = await resolveConfinedExistingPath(root, relativePath)
    const info = await stat(resolved)
    return info.isFile() ? resolved : null
  } catch {
    return null
  }
}

/**
 * Thumbnail for a row whose pixels are inline or under the public image root.
 * Archive rows ('art-archive') are resolved by the route through
 * ensureArchiveThumbnail(), which already owns that cache.
 */
export async function resolveArtImageThumbnail(
  row: ThumbnailSourceRow,
): Promise<ResolvedThumbnail> {
  const version = row.updatedAt ? row.updatedAt.getTime() : 0
  const cacheKey = `${row.id}-${version}`

  for (const candidate of [row.imagePath, row.path, row.fileName]) {
    const relativePath = publicImageRelativePath(candidate)
    if (!relativePath) continue
    const file = await publicImageFile(relativePath)
    if (!file) continue
    const buffer = await cachedDerivative(cacheKey, () => readFile(file))
    return { kind: 'bytes', buffer }
  }

  const inline = decodeInlineImage(row.imageData)
  if (inline) {
    const buffer = await cachedDerivative(cacheKey, async () => inline)
    return { kind: 'bytes', buffer }
  }

  const remote = [row.imagePath, row.path].find(
    (value) => value && isRemoteUrl(value.trim()),
  )
  if (remote) return { kind: 'redirect', url: remote.trim() }

  throw createError({ statusCode: 404, message: 'Image has no stored pixels.' })
}
