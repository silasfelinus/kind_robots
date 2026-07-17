// utils/scripts/mediaContractSource.ts
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const mediaRoot = process.env.MEDIA_ROOT?.trim()
const mediaOrigin = (
  process.env.MEDIA_ORIGIN?.trim() || 'https://media.acrocatranch.com'
).replace(/\/+$/, '')
const requestTimeoutMs = Number(process.env.MEDIA_CONTRACT_TIMEOUT_MS || 15_000)
const existenceCache = new Map<string, Promise<boolean>>()

function normalizeRelativePath(relativePath: string): string {
  const normalized = relativePath.replaceAll('\\', '/').replace(/^\/+/, '')

  if (!normalized || normalized.split('/').includes('..')) {
    throw new Error(`Unsafe media-relative path: ${relativePath}`)
  }

  return normalized
}

export function repositoryFileToMediaPath(file: string): string {
  const normalized = file.replaceAll('\\', '/')
  const prefix = 'public/images/'

  if (!normalized.startsWith(prefix)) {
    throw new Error(`Expected a repository media path under ${prefix}: ${file}`)
  }

  return normalizeRelativePath(normalized.slice(prefix.length))
}

export function imageSrcToMediaPath(imageSrc: string): string {
  const pathname = imageSrc.split(/[?#]/)[0] ?? ''
  const prefix = '/images/'

  if (!pathname.startsWith(prefix)) {
    throw new Error(`Expected an image URL under ${prefix}: ${imageSrc}`)
  }

  return normalizeRelativePath(pathname.slice(prefix.length))
}

export function mediaUrl(relativePath: string): string {
  return `${mediaOrigin}/images/${normalizeRelativePath(relativePath)}`
}

export function mediaSourceDescription(relativePath: string): string {
  const normalized = normalizeRelativePath(relativePath)
  return mediaRoot ? resolve(mediaRoot, normalized) : mediaUrl(normalized)
}

export async function readMediaText(relativePath: string): Promise<string> {
  const normalized = normalizeRelativePath(relativePath)

  if (mediaRoot) {
    return readFile(resolve(mediaRoot, normalized), 'utf8')
  }

  const url = mediaUrl(normalized)
  const response = await fetch(url, {
    signal: AbortSignal.timeout(requestTimeoutMs),
  })

  if (!response.ok) {
    throw new Error(`Unable to read media contract ${url}: HTTP ${response.status}`)
  }

  return response.text()
}

export async function mediaAssetExists(relativePath: string): Promise<boolean> {
  const normalized = normalizeRelativePath(relativePath)
  const cached = existenceCache.get(normalized)
  if (cached) return cached

  const pending = (async () => {
    if (mediaRoot) {
      try {
        await access(resolve(mediaRoot, normalized))
        return true
      } catch {
        return false
      }
    }

    try {
      const response = await fetch(mediaUrl(normalized), {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(requestTimeoutMs),
      })
      return response.ok
    } catch {
      return false
    }
  })()

  existenceCache.set(normalized, pending)
  return pending
}
