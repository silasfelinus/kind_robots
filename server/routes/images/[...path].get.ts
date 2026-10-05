import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import {
  createError,
  defineEventHandler,
  getRouterParam,
  sendStream,
  setResponseHeader,
} from 'h3'
import { getImageStorageRoot } from '~/server/utils/imageStorageRoot'
import prisma from '~/server/utils/prisma'
import {
  canReadArtImage,
  getMediaViewerAccessContext,
} from '~/server/utils/artImageAccess'

const CONTENT_TYPES: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
}

const DEFAULT_MEDIA_ORIGIN = 'https://media.acrocatranch.com'
const REMOTE_FALLBACK_PREFIXES = ['academy/', 'dashboard-tabs/academy/']
const REMOTE_FALLBACK_TIMEOUT_MS = 15_000

function remoteFallbackUrl(relativePath: string): string | null {
  if (
    !REMOTE_FALLBACK_PREFIXES.some((prefix) => relativePath.startsWith(prefix))
  ) {
    return null
  }

  const mediaOrigin = (
    process.env.MEDIA_ORIGIN?.trim() || DEFAULT_MEDIA_ORIGIN
  ).replace(/\/+$/, '')
  const encodedPath = relativePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `${mediaOrigin}/images/${encodedPath}`
}

async function fetchRemoteFallback(
  relativePath: string,
): Promise<Response | null> {
  const url = remoteFallbackUrl(relativePath)
  if (!url) return null

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(REMOTE_FALLBACK_TIMEOUT_MS),
    })
    if (!response.ok) return null

    const headers = new Headers(response.headers)
    headers.set('Cache-Control', 'public, max-age=3600')
    headers.set('X-Content-Type-Options', 'nosniff')

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  } catch {
    return null
  }
}

/*
 * Generated renders are stored as `artimage-<id>-<hash>.<ext>` (the
 * generated/<year>/<month>/ landing zone and anywhere else that naming lands).
 * Their bytes used to be served to anyone holding the URL -- including private
 * and mature images, logged out. The id in the name makes the gate one indexed
 * lookup: public, non-mature art keeps the shared public cache; everything else
 * goes through the same canReadArtImage rule as GET /api/art/image/:id, with the
 * viewer identified by API header or the HttpOnly kind-session cookie.
 */
const ART_IMAGE_FILE = /^artimage-(\d+)-/i

/*
 * saveImage used to drop a raw, extensionless, full-size copy named
 * `ArtImageUpload-<timestamp>` (ArtImage.fileName) next to every render; it no
 * longer writes them, but the existing ones stay on the share. They map back
 * through the indexed fileName column; one with no row is admin-only.
 */
const ART_IMAGE_UPLOAD_FILE = /^ArtImageUpload-\d+$/

type ArtImageFileGate = 'public' | 'private' | 'denied' | 'not-art'

type GatedArtImage = {
  userId: number | null
  isPublic: boolean | null
  isMature: boolean | null
}

const NEWEST_FIRST = [{ updatedAt: 'desc' as const }, { id: 'desc' as const }]
const GATE_SELECT = { userId: true, isPublic: true, isMature: true } as const

async function decide(
  event: Parameters<typeof getMediaViewerAccessContext>[0],
  image: GatedArtImage | null,
): Promise<ArtImageFileGate> {
  if (image && image.isPublic === true && image.isMature !== true) {
    return 'public'
  }
  // An orphaned art file (its row deleted) is treated as private: admin only.
  const access = await getMediaViewerAccessContext(event)
  const record = image ?? { userId: null, isPublic: false, isMature: true }
  return canReadArtImage(record, access) ? 'private' : 'denied'
}

/*
 * Which ArtImage, if any, owns this file -- and so whose private/mature rule
 * applies. Three shapes, cheapest first:
 *   artimage-<id>-*.ext   the generated/ landing zone: primary key.
 *   ArtImageUpload-<ts>   legacy raw copies: indexed fileName.
 *   anything else         entity-filed art (characters/<slug>/...), gallery
 *                         uploads: indexed imagePath. Several rows can share an
 *                         entity path (a re-render overwrites the file in
 *                         place), so the newest row -- the one whose bytes are
 *                         on disk -- decides. No row: not ArtImage-backed
 *                         (site art, icons), served as before.
 */
async function gateArtImageFile(
  event: Parameters<typeof getMediaViewerAccessContext>[0],
  fileName: string,
  servedPath: string,
): Promise<ArtImageFileGate> {
  const byId = ART_IMAGE_FILE.exec(fileName)
  if (byId) {
    const id = Number(byId?.[1] ?? Number.NaN)
    const image = Number.isSafeInteger(id)
      ? await prisma.artImage.findUnique({ where: { id }, select: GATE_SELECT })
      : null
    return decide(event, image)
  }

  if (ART_IMAGE_UPLOAD_FILE.test(fileName)) {
    const image = await prisma.artImage.findFirst({
      where: { fileName },
      orderBy: NEWEST_FIRST,
      select: GATE_SELECT,
    })
    return decide(event, image)
  }

  const image = await prisma.artImage.findFirst({
    where: { imagePath: servedPath },
    orderBy: NEWEST_FIRST,
    select: GATE_SELECT,
  })
  return image ? decide(event, image) : 'not-art'
}

export default defineEventHandler(async (event) => {
  const rawPath = getRouterParam(event, 'path') || ''

  let relativePath: string
  try {
    relativePath = decodeURIComponent(rawPath)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid image path' })
  }

  relativePath = relativePath.replace(/^\/+/, '')
  if (!relativePath) {
    throw createError({ statusCode: 404, statusMessage: 'Image not found' })
  }

  const root = getImageStorageRoot()
  const filePath = path.resolve(root, relativePath)
  const rootPrefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`

  if (!filePath.startsWith(rootPrefix)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid image path' })
  }

  // Gate on the RESOLVED file's own name, not the request string: resolve()
  // normalizes `x.webp/`, `x.webp/.` and `a/../x.webp` to the same file, and a
  // pattern matched against the raw path would let those walk past the gate.
  const servedPath = `/images/${path
    .relative(root, filePath)
    .split(path.sep)
    .join('/')}`
  const gate = await gateArtImageFile(
    event,
    path.basename(filePath),
    servedPath,
  )
  if (gate === 'denied') {
    throw createError({ statusCode: 404, statusMessage: 'Image not found' })
  }

  let fileStat
  try {
    fileStat = await stat(filePath)
  } catch {
    const fallbackResponse = await fetchRemoteFallback(relativePath)
    if (fallbackResponse) return fallbackResponse

    throw createError({ statusCode: 404, statusMessage: 'Image not found' })
  }

  if (!fileStat.isFile()) {
    throw createError({ statusCode: 404, statusMessage: 'Image not found' })
  }

  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()]
  if (contentType) setResponseHeader(event, 'Content-Type', contentType)

  setResponseHeader(event, 'Content-Length', fileStat.size)
  setResponseHeader(event, 'Last-Modified', fileStat.mtime.toUTCString())
  setResponseHeader(
    event,
    'Cache-Control',
    gate === 'private' ? 'private, no-store' : 'public, max-age=3600',
  )
  if (gate === 'private')
    setResponseHeader(event, 'Vary', 'Cookie, Authorization')
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')

  return sendStream(event, createReadStream(filePath))
})
