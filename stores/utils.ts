// @/stores/util
import { useUserStore } from '~/stores/userStore'
import { useErrorStore, ErrorType } from '~/stores/errorStore'

export type ApiResponse<T> = {
  success: boolean
  message: string
  data?: T
}

export async function performFetch<T>(
  url: string,
  options: RequestInit = {},
  retries = 3,
  timeout = 8000,
): Promise<ApiResponse<T>> {
  const errorStore = useErrorStore()
  const userStore = useUserStore()
  const apiKey = userStore?.apiKey

  // Setup headers, ensuring Authorization and Content-Type are set correctly
  const headers: HeadersInit = {
    ...(options.headers || {}),
    'Content-Type': 'application/json',
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  }

  // Nested function to handle request with timeout
  const fetchWithTimeout = (
    url: string,
    options: RequestInit,
    timeout: number,
  ): Promise<Response> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Request timed out')),
        timeout,
      )

      fetch(url, options)
        .then((response) => {
          clearTimeout(timer)
          resolve(response)
        })
        .catch((error) => {
          clearTimeout(timer)
          reject(error)
        })
    })
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(
        url,
        { ...options, headers },
        timeout,
      )

      // Parse response as ApiResponse<T>
      const parsedResponse = (await response.json()) as ApiResponse<T>

      if (!parsedResponse.success || !response.ok) {
        const message =
          parsedResponse.message || response.statusText || 'Unknown error'
        errorStore.setError(ErrorType.NETWORK_ERROR, message)
        return { success: false, message }
      }

      return parsedResponse // Directly return parsed ApiResponse<T>
    } catch (error) {
      if (attempt === retries) {
        const message =
          error instanceof Error ? error.message : 'Unknown network error'
        errorStore.setError(ErrorType.NETWORK_ERROR, message)
        return { success: false, message }
      }
    }
  }

  return { success: false, message: 'All fetch attempts failed' }
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
