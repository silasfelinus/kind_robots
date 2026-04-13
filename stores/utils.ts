// @/stores/util
import { useUserStore } from '~/stores/userStore'
import { useErrorStore, ErrorType } from '~/stores/errorStore'

export type ApiResponse<T> = {
  success: boolean
  message: string
  data?: T
  user?: User
  token?: string
  apiKey?: string
  usernames?: string[]
}

export async function performFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
  retries = 1,
  timeout = 10000,
): Promise<ApiResponse<T> & { status?: number }> {
  const userStore = useUserStore()
  const errorStore = useErrorStore()
  const token = userStore.user?.apiKey

  const normalizedHeaders = new Headers(options.headers ?? {})

  if (!normalizedHeaders.has('Content-Type') && options.body) {
    normalizedHeaders.set('Content-Type', 'application/json')
  }

  if (token && !normalizedHeaders.has('Authorization')) {
    normalizedHeaders.set('Authorization', `Bearer ${token}`)
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

      return {
        success: res.ok,
        status: res.status,
        data: (body.data ?? parsedBody) as T,
        message:
          typeof body.message === 'string'
            ? body.message
            : res.ok
              ? 'Request completed successfully'
              : `Request failed with status ${res.status}`,
        user: body.user as ApiResponse<T>['user'],
        token: typeof body.token === 'string' ? body.token : undefined,
        apiKey: typeof body.apiKey === 'string' ? body.apiKey : undefined,
        usernames: Array.isArray(body.usernames)
          ? (body.usernames as string[])
          : undefined,
      }
    } catch (err) {
      clearTimeout(timeoutId)

      const isAbortError = err instanceof Error && err.name === 'AbortError'
      const isLastAttempt = attempt >= maxAttempts

      if (isLastAttempt || isAbortError) {
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
  TAG = 'TAG', // single unit tag phrase
  PROMPT = 'PROMPT', // combined nlp prompt message
  WILDCARD = 'WILDCARD', // list for randomized generations
  RESPONSE = 'RESPONSE', // message response nlp to human
  IMAGE_URL = 'IMAGE_URL', // image url
  URL = 'URL', // generic web url
  MASK_URL = 'MASK_URL', // url to an image mask
  CODE = 'CODE', // validated codewall
  ERROR = 'ERROR', // An Error message
}

export enum BotType {
  PROMPTBOT = 'PROMPTBOT',
  CHATBOT = 'CHATBOT',
  ARTBOT = 'ARTBOT',
}
