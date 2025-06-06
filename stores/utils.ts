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
  const token = userStore.user?.apiKey
  const headers = {
    ...(options.headers || {}),
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  let attempt = 0
  while (attempt < retries) {
    try {
      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), timeout)

      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      })

      clearTimeout(id)
      const json = await res.json().catch(() => ({}))

      return {
        success: res.ok,
        status: res.status,
        data: json.data ?? json,
        message: json.message ?? 'No message returned from server',
        user: json.user ?? undefined,
        token: json.token ?? undefined,
        apiKey: json.apiKey ?? undefined,
        usernames: json.usernames ?? undefined,
      }
    } catch (err) {
      attempt++
      const isAbortError = err instanceof Error && err.name === 'AbortError'

      if (attempt >= retries || isAbortError) {
        console.error(`[performFetch] Failed after ${attempt} attempt(s):`, err)

        const errorStore = useErrorStore()
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `Failed fetch: ${url} (attempt ${attempt})`,
        )

        return {
          success: false,
          status: 500,
          message: 'Network or server error',
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
