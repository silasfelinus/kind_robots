import { defineStore } from 'pinia'

export enum ErrorType {
  NETWORK_ERROR = 'Network Error',
  VALIDATION_ERROR = 'Validation Error',
  AUTH_ERROR = 'Authentication Error',
  UNKNOWN_ERROR = 'Unknown Error',
}

export interface ErrorHistoryEntry {
  type: ErrorType
  message: string
  timestamp: Date
}

export const useErrorStore = defineStore('error', {
  state: () => ({
    message: null as string | null,
    type: null as ErrorType | null,
    history: [] as ErrorHistoryEntry[],
  }),
  actions: {
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
    },

    clearError() {
      this.message = null
      this.type = null
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
