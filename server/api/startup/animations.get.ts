import { defineEventHandler, getQuery, setHeader } from 'h3'
import { listStartupAnimationUrls } from '@/server/utils/startupAnimations'

const DEFAULT_MEDIA_ORIGIN = 'https://media.acrocatranch.com'
const DIAGNOSTIC_TIMEOUT_MS = 4_000

export interface StartupAnimationDiagnostic {
  url: string
  status: number | null
  bytes: number | null
  contentType: string | null
  elapsedMs: number
}

export interface StartupAnimationsResponse {
  animations: string[]
  diagnostics?: StartupAnimationDiagnostic[]
}

async function inspectAnimation(url: string): Promise<StartupAnimationDiagnostic> {
  const origin = (process.env.MEDIA_ORIGIN || DEFAULT_MEDIA_ORIGIN).replace(/\/+$/, '')
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DIAGNOSTIC_TIMEOUT_MS)
  const startedAt = Date.now()

  try {
    const response = await fetch(`${origin}${url}`, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
    })
    const rawLength = response.headers.get('content-length')
    const parsedLength = rawLength ? Number(rawLength) : Number.NaN

    return {
      url,
      status: response.status,
      bytes: Number.isFinite(parsedLength) ? parsedLength : null,
      contentType: response.headers.get('content-type'),
      elapsedMs: Date.now() - startedAt,
    }
  } catch {
    return {
      url,
      status: null,
      bytes: null,
      contentType: null,
      elapsedMs: Date.now() - startedAt,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

export default defineEventHandler(async (event): Promise<StartupAnimationsResponse> => {
  const diagnosticsRequested = getQuery(event).diagnostics === '1'

  setHeader(
    event,
    'Cache-Control',
    diagnosticsRequested
      ? 'private, no-store'
      : 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
  )

  const animations = await listStartupAnimationUrls()

  return {
    animations,
    ...(diagnosticsRequested
      ? { diagnostics: await Promise.all(animations.map(inspectAnimation)) }
      : {}),
  }
})
