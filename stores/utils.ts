// @/stores/util
import { useUserStore } from '~/stores/userStore'
import { useErrorStore, ErrorType } from '~/stores/errorStore'
import type { ApiResponse } from '~/types/api'

// Circuit breaker: after several consecutive transport-level failures
// (timeouts, refused connections — not HTTP error responses), stop hammering
// the API for a cool-off window so a dead database doesn't turn every page
// into a pile of 10-second hangs. Client-only; server module state is shared
// across requests and must not be poisoned by one bad render.
const CIRCUIT_THRESHOLD = 3
const CIRCUIT_COOLDOWN_MS = 30_000
const WEAK_PROMPT_REPAIR_URL = '/api/art/queue/repair-weak-prompts'
const WEAK_PROMPT_REPAIR_BATCH_SIZE = 20
const WEAK_PROMPT_REPAIR_BATCH_TIMEOUT_MS = 45_000
let consecutiveTransportFailures = 0
let circuitOpenUntil = 0

type JsonRecord = Record<string, unknown>

type WeakPromptRepairBatch = {
  dryRun: boolean
  snapshotMaxId: number
  cursor: number
  nextCursor: number
  complete: boolean
  totalCandidateCount: number
  scanTargetCount: number
  limited: boolean
  batchScannedCount: number
  scannedCount: number
  repairedCount: number
  unresolvedCount: number
  repaired: unknown[]
  unresolved: unknown[]
}

type WeakPromptRepairProgressDetail = {
  phase: 'starting' | 'scanning' | 'repairing' | 'complete' | 'error'
  dryRun: boolean
  scannedCount: number
  totalCount: number
  candidateCount: number
  recoverableCount: number
  unresolvedCount: number
  limited: boolean
  message: string
}

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonRecord
}

function circuitIsOpen(): boolean {
  return import.meta.client && Date.now() < circuitOpenUntil
}

function recordTransportFailure(): void {
  if (!import.meta.client) return
  consecutiveTransportFailures += 1
  if (consecutiveTransportFailures >= CIRCUIT_THRESHOLD) {
    circuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS
  }
}

function recordTransportSuccess(): void {
  consecutiveTransportFailures = 0
  circuitOpenUntil = 0
}

function isWeakPromptRepairRequest(
  url: string,
  options: RequestInit,
): boolean {
  if (!import.meta.client) return false
  const path = url.split('?')[0]
  const method = String(options.method || 'GET').toUpperCase()
  return path === WEAK_PROMPT_REPAIR_URL && method === 'POST'
}

function parseJsonRequestBody(body: BodyInit | null | undefined): JsonRecord {
  if (typeof body !== 'string' || !body.trim()) return {}
  try {
    return asRecord(JSON.parse(body))
  } catch {
    return {}
  }
}

function dispatchWeakPromptRepairProgress(
  detail: WeakPromptRepairProgressDetail,
): void {
  if (!import.meta.client) return
  window.dispatchEvent(
    new CustomEvent<WeakPromptRepairProgressDetail>(
      'artjob-repair-progress',
      { detail },
    ),
  )
}

async function performWeakPromptRepairBatches<T>(
  url: string,
  options: RequestInit,
  headers: Headers,
  timeout: number,
): Promise<ApiResponse<T> & { status?: number }> {
  const request = parseJsonRequestBody(options.body)
  const dryRun = request.dryRun === true
  const requestedLimit = Number(request.limit)
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.floor(requestedLimit)
      : 5000
  const batchTimeout = Math.min(
    Math.max(timeout, 15_000),
    WEAK_PROMPT_REPAIR_BATCH_TIMEOUT_MS,
  )

  let cursor = 0
  let snapshotMaxId = 0
  let scannedCount = 0
  let totalCandidateCount = 0
  let scanTargetCount = 0
  let limited = false
  let repairedCount = 0
  let unresolvedCount = 0
  const repaired: unknown[] = []
  const unresolved: unknown[] = []

  dispatchWeakPromptRepairProgress({
    phase: 'starting',
    dryRun,
    scannedCount: 0,
    totalCount: 0,
    candidateCount: 0,
    recoverableCount: 0,
    unresolvedCount: 0,
    limited: false,
    message: dryRun
      ? 'Counting ArtJobs before the weak-prompt scan…'
      : 'Counting ArtJobs before repair begins…',
  })

  while (true) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), batchTimeout)

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        body: JSON.stringify({
          ...request,
          dryRun,
          limit,
          batchSize: WEAK_PROMPT_REPAIR_BATCH_SIZE,
          cursor,
          snapshotMaxId: snapshotMaxId || undefined,
          processedCount: scannedCount,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const parsedBody = (await res.json().catch(() => ({}))) as JsonRecord
      const bodySuccess =
        typeof parsedBody.success === 'boolean' ? parsedBody.success : true
      const effectiveStatus =
        typeof parsedBody.statusCode === 'number'
          ? parsedBody.statusCode
          : res.status

      if (!res.ok || !bodySuccess) {
        recordTransportSuccess()
        const message =
          typeof parsedBody.message === 'string'
            ? parsedBody.message
            : `Weak-prompt batch failed with status ${effectiveStatus}`
        dispatchWeakPromptRepairProgress({
          phase: 'error',
          dryRun,
          scannedCount,
          totalCount: scanTargetCount,
          candidateCount: totalCandidateCount,
          recoverableCount: repairedCount,
          unresolvedCount,
          limited,
          message,
        })
        return {
          success: false,
          status: effectiveStatus,
          message,
        }
      }

      recordTransportSuccess()
      const batch = asRecord(parsedBody.data) as Partial<WeakPromptRepairBatch>
      const batchScannedCount = Number(batch.batchScannedCount) || 0
      const nextCursor = Number(batch.nextCursor) || cursor

      snapshotMaxId = Number(batch.snapshotMaxId) || snapshotMaxId
      totalCandidateCount =
        Number(batch.totalCandidateCount) || totalCandidateCount
      scanTargetCount = Number(batch.scanTargetCount) || scanTargetCount
      limited = batch.limited === true
      scannedCount = Number(batch.scannedCount) || scannedCount
      repairedCount += Number(batch.repairedCount) || 0
      unresolvedCount += Number(batch.unresolvedCount) || 0

      if (Array.isArray(batch.repaired)) repaired.push(...batch.repaired)
      if (Array.isArray(batch.unresolved)) unresolved.push(...batch.unresolved)

      const phase = dryRun ? 'scanning' : 'repairing'
      const weakCount = repairedCount + unresolvedCount
      const countLabel = scanTargetCount
        ? `${scannedCount.toLocaleString()} / ${scanTargetCount.toLocaleString()}`
        : scannedCount.toLocaleString()

      dispatchWeakPromptRepairProgress({
        phase,
        dryRun,
        scannedCount,
        totalCount: scanTargetCount,
        candidateCount: totalCandidateCount,
        recoverableCount: repairedCount,
        unresolvedCount,
        limited,
        message: dryRun
          ? `Scanning ${countLabel} ArtJobs · ${weakCount.toLocaleString()} weak prompts found`
          : `Repairing ${countLabel} ArtJobs · ${repairedCount.toLocaleString()} queued · ${unresolvedCount.toLocaleString()} need a human`,
      })

      if (batch.complete === true) break

      if (batchScannedCount <= 0 || nextCursor <= cursor) {
        const message =
          'Weak-prompt scan stopped because the next batch made no progress.'
        dispatchWeakPromptRepairProgress({
          phase: 'error',
          dryRun,
          scannedCount,
          totalCount: scanTargetCount,
          candidateCount: totalCandidateCount,
          recoverableCount: repairedCount,
          unresolvedCount,
          limited,
          message,
        })
        return {
          success: false,
          status: 500,
          message,
        }
      }

      cursor = nextCursor
    } catch (err) {
      clearTimeout(timeoutId)
      recordTransportFailure()

      const isAbortError = err instanceof Error && err.name === 'AbortError'
      const message = isAbortError
        ? `Weak-prompt batch timed out after ${batchTimeout}ms at ${scannedCount.toLocaleString()} scanned jobs`
        : err instanceof Error
          ? err.message
          : 'Network or server error during weak-prompt repair'

      dispatchWeakPromptRepairProgress({
        phase: 'error',
        dryRun,
        scannedCount,
        totalCount: scanTargetCount,
        candidateCount: totalCandidateCount,
        recoverableCount: repairedCount,
        unresolvedCount,
        limited,
        message,
      })

      return {
        success: false,
        status: isAbortError ? 408 : 500,
        message,
      }
    }
  }

  const weakCount = repairedCount + unresolvedCount
  const limitNote = limited
    ? ` The scan was limited to ${scanTargetCount.toLocaleString()} of ${totalCandidateCount.toLocaleString()} eligible jobs.`
    : ''
  const message = dryRun
    ? `Scanned ${scannedCount.toLocaleString()} ArtJobs and found ${weakCount.toLocaleString()} weak prompts: ${repairedCount.toLocaleString()} recoverable and ${unresolvedCount.toLocaleString()} unresolved.${limitNote}`
    : `Scanned ${scannedCount.toLocaleString()} ArtJobs, repaired ${repairedCount.toLocaleString()}, and left ${unresolvedCount.toLocaleString()} unresolved.${limitNote}`

  dispatchWeakPromptRepairProgress({
    phase: 'complete',
    dryRun,
    scannedCount,
    totalCount: scanTargetCount,
    candidateCount: totalCandidateCount,
    recoverableCount: repairedCount,
    unresolvedCount,
    limited,
    message,
  })

  return {
    success: true,
    status: 200,
    data: {
      dryRun,
      scannedCount,
      repairedCount,
      unresolvedCount,
      repaired,
      unresolved,
      totalCandidateCount,
      scanTargetCount,
      limited,
    } as T,
    message,
  }
}

export async function performFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
  retries = 1,
  timeout = 10000,
): Promise<ApiResponse<T> & { status?: number }> {
  const userStore = useUserStore()
  const errorStore = useErrorStore()
  const token = userStore.token || userStore.user?.token || ''

  const normalizedHeaders = new Headers(options.headers ?? {})

  if (
    !normalizedHeaders.has('Content-Type') &&
    options.body &&
    !(options.body instanceof FormData)
  ) {
    normalizedHeaders.set('Content-Type', 'application/json')
  }

  if (token && !normalizedHeaders.has('Authorization')) {
    normalizedHeaders.set('Authorization', `Bearer ${token}`)
  }

  if (circuitIsOpen()) {
    return {
      success: false,
      status: 503,
      message: `Skipped ${url}: API unreachable, cooling off before retrying`,
    }
  }

  if (isWeakPromptRepairRequest(url, options)) {
    const result = await performWeakPromptRepairBatches<T>(
      url,
      options,
      normalizedHeaders,
      timeout,
    )
    if (!result.success) {
      errorStore.setError(
        ErrorType.NETWORK_ERROR,
        `Weak-prompt repair stopped: ${result.message}`,
      )
    }
    return result
  }

  const maxAttempts = Math.max(1, retries)

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const res = await fetch(url, {
        ...options,
        headers: normalizedHeaders,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const contentType = res.headers.get('content-type') || ''
      const isJson = contentType.includes('application/json')

      let parsedBody: unknown = {}

      if (res.status !== 204) {
        if (isJson) {
          parsedBody = await res.json().catch(() => ({}))
        } else {
          const text = await res.text().catch(() => '')
          parsedBody = text ? { message: text } : {}
        }
      }

      const body =
        parsedBody && typeof parsedBody === 'object'
          ? (parsedBody as Record<string, unknown>)
          : {}

      // Reaching the server at all closes the circuit, even on an HTTP error.
      recordTransportSuccess()

      // Many endpoints follow the app convention of replying HTTP 200 with
      // { success: false, statusCode } in the body — honor both fields so a
      // body-level failure is never reported as a successful fetch.
      const bodySuccess =
        typeof body.success === 'boolean' ? body.success : true
      const effectiveStatus =
        typeof body.statusCode === 'number' ? body.statusCode : res.status

      return {
        success: res.ok && bodySuccess,
        status: effectiveStatus,
        data: (body.data ?? parsedBody) as T,
        message:
          typeof body.message === 'string'
            ? body.message
            : res.ok && bodySuccess
              ? 'Request completed successfully'
              : `Request failed with status ${effectiveStatus}`,
        user: body.user as ApiResponse<T>['user'],
        token: typeof body.token === 'string' ? body.token : undefined,
        usernames: Array.isArray(body.usernames)
          ? (body.usernames as string[])
          : undefined,
      }
    } catch (err) {
      clearTimeout(timeoutId)

      const isAbortError = err instanceof Error && err.name === 'AbortError'
      const isLastAttempt = attempt >= maxAttempts

      if (isLastAttempt || isAbortError) {
        recordTransportFailure()

        const message = isAbortError
          ? `Request timed out after ${timeout}ms`
          : err instanceof Error
            ? err.message
            : 'Network or server error'

        console.error(`[performFetch] Failed after ${attempt} attempt(s):`, err)

        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `Failed fetch: ${url} (attempt ${attempt}) - ${message}`,
        )

        return {
          success: false,
          status: isAbortError ? 408 : 500,
          message,
        }
      }
    }
  }

  return {
    success: false,
    status: 500,
    message: 'Unreachable code reached in performFetch',
  }
}

export type Timestamp = string

export function handleError(err: unknown, action: string) {
  const errorStore = useErrorStore()
  if (err instanceof Error) {
    errorStore.setError(
      ErrorType.NETWORK_ERROR,
      `An error occurred while ${action}: ${err.message}`,
    )
  } else {
    errorStore.setError(
      ErrorType.UNKNOWN_ERROR,
      `An unknown error occurred while ${action}.`,
    )
  }
}

export enum ModelType {
  BOT = 'BOT',
  GALLERY = 'GALLERY',
  IMAGE = 'IMAGE',
  MESSAGE = 'MESSAGE',
  PROJECT = 'PROJECT',
  PROMPT = 'PROMPT',
  QUEST = 'QUEST',
  REACTION = 'REACTION',
  REVIEW = 'REVIEW',
  USER = 'USER',
}

export enum ResourceType {
  CHECKPOINT = 'CHECKPOINT',
  EMBEDDING = 'EMBEDDING',
  LORA = 'LORA',
  LYCORIS = 'LYCORIS',
  HYPERNETWORK = 'HYPERNETWORK',
  CONTROLNET = 'CONTROLNET',
  URL = 'URL',
}

export enum MediaType {
  IMAGE,
  VIDEO,
  AUDIO,
  TEXT,
}

export enum Role {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  ADMIN = 'ADMIN',
  GUEST = 'GUEST',
  BOT = 'BOT',
  DESIGNER = 'DESIGNER',
}

export enum StringType {
  TAG = 'TAG',
  PROMPT = 'PROMPT',
  WILDCARD = 'WILDCARD',
  RESPONSE = 'RESPONSE',
  IMAGE_URL = 'IMAGE_URL',
  URL = 'URL',
  MASK_URL = 'MASK_URL',
  CODE = 'CODE',
  ERROR = 'ERROR',
}

export enum BotType {
  PROMPTBOT = 'PROMPTBOT',
  CHATBOT = 'CHATBOT',
  ARTBOT = 'ARTBOT',
}
