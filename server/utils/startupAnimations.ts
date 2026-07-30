import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { getImageStorageRoot } from './imageStorageRoot'

const STARTUP_DIRECTORY = 'startup-animations'
const STARTUP_FILENAME = /^launch-[a-z0-9][a-z0-9-]*\.webp$/i
const DEFAULT_MEDIA_ORIGIN = 'https://media.acrocatranch.com'
const DISCOVERY_CACHE_MS = 60_000
const REMOTE_PROBE_LIMIT = 40
const REQUEST_TIMEOUT_MS = 2_500

let cachedUrls: string[] = []
let cacheExpiresAt = 0
let discoveryPromise: Promise<string[]> | null = null

function publicUrl(filename: string): string {
  return `/images/${STARTUP_DIRECTORY}/${filename}`
}

function normalizeFilename(value: string): string | null {
  let decoded = value

  try {
    decoded = decodeURIComponent(value)
  } catch {
    // Keep the undecoded value and let the strict filename check reject it.
  }

  const filename = path.posix.basename(decoded.split(/[?#]/, 1)[0] || '')
  return STARTUP_FILENAME.test(filename) ? filename : null
}

function uniqueSortedUrls(filenames: Iterable<string>): string[] {
  return [...new Set(filenames)]
    .filter((filename) => STARTUP_FILENAME.test(filename))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
    .map(publicUrl)
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await fetch(input, {
      redirect: 'follow',
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function discoverFromFilesystem(): Promise<string[]> {
  const directory = path.join(getImageStorageRoot(), STARTUP_DIRECTORY)

  try {
    const entries = await readdir(directory, { withFileTypes: true })
    return uniqueSortedUrls(
      entries
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name),
    )
  } catch {
    return []
  }
}

function filenamesFromManifest(value: unknown): string[] {
  const entries = Array.isArray(value)
    ? value
    : value && typeof value === 'object' && Array.isArray((value as { images?: unknown }).images)
      ? (value as { images: unknown[] }).images
      : []

  return entries
    .filter((entry): entry is string => typeof entry === 'string')
    .map(normalizeFilename)
    .filter((entry): entry is string => Boolean(entry))
}

async function discoverFromManifest(directoryUrl: string): Promise<string[]> {
  for (const manifestName of ['manifest.json', 'index.json']) {
    try {
      const response = await fetchWithTimeout(`${directoryUrl}${manifestName}`, {
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) continue

      const filenames = filenamesFromManifest(await response.json())
      if (filenames.length) return uniqueSortedUrls(filenames)
    } catch {
      // Try the next discovery strategy.
    }
  }

  return []
}

async function discoverFromDirectoryIndex(directoryUrl: string): Promise<string[]> {
  try {
    const response = await fetchWithTimeout(directoryUrl, {
      headers: { Accept: 'text/html' },
    })
    if (!response.ok) return []

    const html = await response.text()
    const filenames: string[] = []

    for (const match of html.matchAll(/href=["']([^"']+)["']/gi)) {
      const filename = normalizeFilename(match[1] || '')
      if (filename) filenames.push(filename)
    }

    return uniqueSortedUrls(filenames)
  } catch {
    return []
  }
}

async function remoteFileExists(url: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(url, { method: 'HEAD' })
    if (response.ok) return true
    if (response.status !== 405) return false
  } catch {
    return false
  }

  try {
    const response = await fetchWithTimeout(url, {
      headers: { Range: 'bytes=0-0' },
    })
    return response.ok || response.status === 206
  } catch {
    return false
  }
}

async function discoverByNumberedProbe(directoryUrl: string): Promise<string[]> {
  const candidates = Array.from({ length: REMOTE_PROBE_LIMIT }, (_, index) => {
    const filename = `launch-${String(index + 1).padStart(2, '0')}.webp`
    return { filename, url: `${directoryUrl}${filename}` }
  })

  const checks = await Promise.all(
    candidates.map(async (candidate) => ({
      ...candidate,
      exists: await remoteFileExists(candidate.url),
    })),
  )

  return uniqueSortedUrls(
    checks.filter((candidate) => candidate.exists).map((candidate) => candidate.filename),
  )
}

async function discoverFromMediaOrigin(): Promise<string[]> {
  const origin = (process.env.MEDIA_ORIGIN || DEFAULT_MEDIA_ORIGIN).replace(/\/+$/, '')
  const directoryUrl = `${origin}/images/${STARTUP_DIRECTORY}/`

  const manifestUrls = await discoverFromManifest(directoryUrl)
  if (manifestUrls.length) return manifestUrls

  const indexedUrls = await discoverFromDirectoryIndex(directoryUrl)
  if (indexedUrls.length) return indexedUrls

  return discoverByNumberedProbe(directoryUrl)
}

async function discoverStartupAnimations(): Promise<string[]> {
  const filesystemUrls = await discoverFromFilesystem()
  if (filesystemUrls.length) return filesystemUrls

  return discoverFromMediaOrigin()
}

export async function listStartupAnimationUrls(): Promise<string[]> {
  if (Date.now() < cacheExpiresAt) return cachedUrls
  if (discoveryPromise) return discoveryPromise

  discoveryPromise = discoverStartupAnimations()
    .then((urls) => {
      cachedUrls = urls
      cacheExpiresAt = Date.now() + DISCOVERY_CACHE_MS
      return urls
    })
    .finally(() => {
      discoveryPromise = null
    })

  return discoveryPromise
}
