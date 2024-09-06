import { defineStore } from 'pinia'

export enum ErrorType {
  NETWORK_ERROR = 'Network Error',
  VALIDATION_ERROR = 'Validation Error',
  AUTH_ERROR = 'Authentication Error',
  UNKNOWN_ERROR = 'Unknown Error',
  GENERAL_ERROR = 'General Error',
  REGISTRATION_ERROR = 'Registration Error',
}

export interface ErrorHistoryEntry {
  type: ErrorType
  message: string
  timestamp: Date
}

interface ErrorState {
  message: string | null
  type: ErrorType | null
  history: ErrorHistoryEntry[]
}

const MAX_HISTORY = 100 // Limit the history to 100 errors for better memory management

export const useErrorStore = defineStore('error', {
  state: (): ErrorState => ({
    message: null,
    type: null,
    history: [],
  }),

  actions: {
    getError: (state: ErrorState) => state.message,

    setError(type: ErrorType, message: unknown) {
      let errorMessage: string

      if (message instanceof Error) {
        errorMessage = message.message
      } else if (typeof message === 'string') {
        errorMessage = message
      } else {
        errorMessage = 'An unknown error occurred'
      }

      const errorEntry: ErrorHistoryEntry = {
        type,
        message: errorMessage,
        timestamp: new Date(),
      }

      this.message = errorMessage
      this.type = type
      this.history.push(errorEntry)

      // Trim history if it exceeds the maximum allowed size
      if (this.history.length > MAX_HISTORY) {
        this.history.shift()
      }
    },

    clearError() {
      this.message = null
      this.type = null
    },

    clearErrorHistory() {
      this.history = []
    },

    async handleError<T>(
      handler: () => Promise<T>,
      type: ErrorType = ErrorType.UNKNOWN_ERROR,
      errorMessage: string = 'An error occurred',
    ): Promise<T> {
      try {
        return await handler()
      } catch (error) {
        if (error instanceof Error) {
          errorMessage += ` Details: ${error.message}`
        }
        this.setError(type, errorMessage)
        throw new Error(errorMessage)
      }
    },

    getErrors(): ErrorHistoryEntry[] {
      return this.history
    },

    async checkConnection(): Promise<boolean> {
      return new Promise((resolve, reject) => {
        // Example condition for successful connection
        if (this.history.length > 0) {
          resolve(true)
        } else {
          reject(new Error('Cannot connect to Error store.'))
        }
      })
    },

    async loadStore(): Promise<string> {
      try {
        const errors = this.getErrors()
        return `Loaded ${errors.length} errors. Hopefully, there were no issues.`
      } catch (error) {
        console.error('Error loading store:', error)
        throw error
      }
    },
  },
})
