import { defineStore } from 'pinia'

export enum ErrorType {
  NETWORK_ERROR = 'Network Error',
  VALIDATION_ERROR = 'Validation Error',
  AUTH_ERROR = 'Authentication Error',
  UNKNOWN_ERROR = 'Unknown Error',
  GENERAL_ERROR = 'General Error',
  REGISTRATION_ERROR = 'Registration Error',
  INTERACTION_ERROR = 'Interaction Error',
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
    getError: (state) => state.message,
    getErrors: (state) => state.history,
  },

  actions: {
    /**
     * Sets the current error and adds it to the error history.
     * @param {ErrorType} type - The type of the error.
     * @param {unknown} message - The error message or error object.
     */
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
    addError(type: ErrorType, message: unknown) {
      this.setError(type, message) // Use the existing setError function
    },

    /**
     * Clears the current error state.
     */
    clearError() {
      this.message = null
      this.type = null
    },

    /**
     * Clears the error history.
     */
    clearErrorHistory() {
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
        const detailedErrorMessage = `${errorMessage} Details: ${error instanceof Error ? error.message : ''}`
        this.setError(type, detailedErrorMessage)
        throw new Error(detailedErrorMessage)
      }
    },

    /**
     * Simulates a connection check by verifying error history existence.
     * @returns {Promise<boolean>} Resolves if errors exist, rejects otherwise.
     */
    async checkConnection(): Promise<boolean> {
      return new Promise((resolve, reject) => {
        if (this.history.length > 0) {
          resolve(true)
        } else {
          reject(new Error('Cannot connect to Error store.'))
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
        console.error('Error loading store:', error)
        throw error
      }
    },
  },
})
