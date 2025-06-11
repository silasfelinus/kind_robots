// /stores/errorStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
  timestamp: Date
}

const MAX_HISTORY = 100

export const useErrorStore = defineStore('errorStore', () => {
  const message = ref<string | null>(null)
  const type = ref<ErrorType | null>(null)
  const history = ref<ErrorHistoryEntry[]>([])

  const getError = computed(() => message.value)
  const getErrors = computed(() => history.value)

  function setError(errorType: ErrorType, errorMessage: unknown): void {
    let msg = 'An unknown error occurred'

    if (errorMessage instanceof Error) {
      msg = errorMessage.message
    } else if (typeof errorMessage === 'string' && errorMessage !== undefined) {
      msg = errorMessage
    }

    message.value = msg
    type.value = errorType
    history.value.push({ type: errorType, message: msg, timestamp: new Date() })

    if (history.value.length > MAX_HISTORY) {
      history.value.shift()
    }
  }

  function addError(errorType: ErrorType, msg: unknown): void {
    setError(errorType, msg)
  }

  function clearError(): void {
    message.value = null
    type.value = null
  }

  function clearErrorHistory(): void {
    history.value = []
  }

  async function handleError<T>(
    handler: () => Promise<T>,
    errorType: ErrorType = ErrorType.UNKNOWN_ERROR,
    errorMessage: string = 'An error occurred',
  ): Promise<T> {
    try {
      return await handler()
    } catch (error) {
      const msg = `${errorMessage} Details: ${error instanceof Error ? error.message : ''}`
      setError(errorType, msg)
      throw new Error(msg)
    }
  }

  async function checkConnection(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (history.value.length > 0) {
        resolve(true)
      } else {
        reject(new Error('No errors in store. Connection might be down.'))
      }
    })
  }

  async function loadStore(): Promise<string> {
    try {
      return `Loaded ${getErrors.value.length} errors. Hopefully, there were no issues.`
    } catch (error) {
      const msg = `Error loading store: ${error instanceof Error ? error.message : 'Unknown error'}`
      setError(ErrorType.STORE_ERROR, msg)
      throw new Error(msg)
    }
  }

  return {
    message,
    type,
    history,
    getError,
    getErrors,
    setError,
    addError,
    clearError,
    clearErrorHistory,
    handleError,
    checkConnection,
    loadStore,
  }
})
