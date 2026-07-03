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
let consecutiveTransportFailures = 0
let circuitOpenUntil = 0

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
  RESOURCE = 'RESOURCE',
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
