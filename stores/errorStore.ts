// /stores/errorStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export enum ErrorType {
  NETWORK_ERROR = 'Network Error',
  VALIDATION_ERROR = 'Validation Error',
  AUTH_ERROR = 'Authentication Error',
  UNKNOWN_ERROR = 'Unknown Error',
  GENERAL_ERROR = 'General Error',
  PARSE_ERROR = 'Parse Error',
  REGISTRATION_ERROR = 'Registration Error',
  INTERACTION_ERROR = 'Interaction Error',
  STORE_ERROR = 'Store Error',
}

export interface ErrorHistoryEntry {
  type: ErrorType
  message: string
  context?: string
  timestamp: Date
}

const MAX_HISTORY = 100

export const useErrorStore = defineStore('errorStore', () => {
  const message = ref<string | null>(null)
  const type = ref<ErrorType | null>(null)
  const context = ref<string | null>(null)
  const history = ref<ErrorHistoryEntry[]>([])

  const getError = computed(() => message.value)
  const getErrorType = computed(() => type.value)
  const getErrorContext = computed(() => context.value)
  const getErrors = computed(() => history.value)
  const hasError = computed(() => Boolean(message.value))

  function normalizeError(
    error: unknown,
    fallback = 'An unknown error occurred',
  ): string {
    if (error instanceof Error) return error.message

    if (typeof error === 'string' && error.trim()) {
      return error
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const possibleMessage = (error as { message?: unknown }).message

      if (typeof possibleMessage === 'string' && possibleMessage.trim()) {
        return possibleMessage
      }
    }

    return fallback
  }

  function setError(
    errorType: ErrorType,
    errorMessage: unknown,
    errorContext = '',
  ): string {
    const msg = normalizeError(errorMessage)

    message.value = msg
    type.value = errorType
    context.value = errorContext || null

    history.value.push({
      type: errorType,
      message: msg,
      context: errorContext || undefined,
      timestamp: new Date(),
    })

    if (history.value.length > MAX_HISTORY) {
      history.value.shift()
    }

    return msg
  }

  function report(
    error: unknown,
    errorType: ErrorType = ErrorType.UNKNOWN_ERROR,
    errorContext = '',
    fallback = 'An error occurred',
  ): string {
    return setError(errorType, normalizeError(error, fallback), errorContext)
  }

  function addError(
    errorType: ErrorType,
    errorMessage: unknown,
    errorContext = '',
  ): string {
    return setError(errorType, errorMessage, errorContext)
  }

  function clearError(): void {
    message.value = null
    type.value = null
    context.value = null
  }

  function clearErrorHistory(): void {
    history.value = []
  }

  async function handleError<T>(
    handler: () => Promise<T>,
    errorType: ErrorType = ErrorType.UNKNOWN_ERROR,
    errorContext = '',
    fallback = 'An error occurred',
  ): Promise<T> {
    try {
      return await handler()
    } catch (error) {
      const msg = report(error, errorType, errorContext, fallback)
      throw new Error(msg)
    }
  }

  function loadStore(): string {
    return `Loaded ${getErrors.value.length} errors. Hopefully, the goblins behaved.`
  }

  return {
    message,
    type,
    context,
    history,
    getError,
    getErrorType,
    getErrorContext,
    getErrors,
    hasError,
    normalizeError,
    setError,
    report,
    addError,
    clearError,
    clearErrorHistory,
    handleError,
    loadStore,
  }
})
