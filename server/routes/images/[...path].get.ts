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
  if (!REMOTE_FALLBACK_PREFIXES.some((prefix) => relativePath.startsWith(prefix))) {
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

async function fetchRemoteFallback(relativePath: string): Promise<Response | null> {
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
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')

  return sendStream(event, createReadStream(filePath))
})