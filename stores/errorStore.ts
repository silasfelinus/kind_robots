import { defineStore } from 'pinia'

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

  getters: {
    getError: (state): string | null => state.message,
    getErrors: (state): ErrorHistoryEntry[] => state.history,
  },

  actions: {
    /**
     * Sets the current error and adds it to the error history.
     * @param {ErrorType} type - The type of the error.
     * @param {unknown} message - The error message or error object.
     */
    setError(type: ErrorType, message: unknown): void {
      let errorMessage: string = 'An unknown error occurred'

      if (message instanceof Error) {
        errorMessage = message.message
      } else if (typeof message === 'string' && message !== undefined) {
        errorMessage = message
      }

      this.message = errorMessage
      this.type = type
      this.history.push({ type, message: errorMessage, timestamp: new Date() })

      if (this.history.length > MAX_HISTORY) {
        this.history.shift()
      }
    },

    addError(type: ErrorType, message: unknown): void {
      this.setError(type, message) // Use the existing setError function
    },

    /**
     * Clears the current error state.
     */
    clearError(): void {
      this.message = null
      this.type = null
    },

    /**
     * Clears the error history.
     */
    clearErrorHistory(): void {
      this.history = []
    },

    /**
     * Handles any promise-based operation and catches any errors thrown.
     * @param {() => Promise<T>} handler - The async operation to handle.
     * @param {ErrorType} [type=ErrorType.UNKNOWN_ERROR] - The type of error.
     * @param {string} [errorMessage='An error occurred'] - Custom error message.
     * @returns {Promise<T>} The result of the async operation.
     * @throws Will throw a new Error with the custom error message if the handler fails.
     */
    async handleError<T>(
      handler: () => Promise<T>,
      type: ErrorType = ErrorType.UNKNOWN_ERROR,
      errorMessage: string = 'An error occurred',
    ): Promise<T> {
      try {
        return await handler()
      } catch (error) {
        const detailedErrorMessage = `${errorMessage} Details: ${
          error instanceof Error ? error.message : ''
        }`
        this.setError(type, detailedErrorMessage)
        // Optionally, you could choose to rethrow or not depending on the use case
        throw new Error(detailedErrorMessage)
      }
    },

    /**
     * Simulates a connection check by verifying error history existence.
     * @returns {Promise<boolean>} Resolves if connection is possible, rejects otherwise.
     */
    async checkConnection(): Promise<boolean> {
      return new Promise((resolve, reject) => {
        if (this.history.length > 0) {
          resolve(true)
        } else {
          reject(new Error('No errors in store. Connection might be down.'))
        }
      })
    },

    /**
     * Loads the error store and returns the number of errors loaded.
     * @returns {Promise<string>} The status of the load operation.
     */
    async loadStore(): Promise<string> {
      try {
        const errors = this.getErrors
        return `Loaded ${errors.length} errors. Hopefully, there were no issues.`
      } catch (error) {
        const loadErrorMessage = `Error loading store: ${error instanceof Error ? error.message : 'Unknown error'}`
        this.setError(ErrorType.STORE_ERROR, loadErrorMessage)
        throw new Error(loadErrorMessage)
      }
    },
  },
})
