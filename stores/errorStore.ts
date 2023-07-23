// ~/stores/error
import { defineStore } from 'pinia'

// Define the types of errors that can occur in your application.
// This helps to keep error handling consistent and explicit.
export enum ErrorType {
  NETWORK_ERROR,
  VALIDATION_ERROR,
  AUTH_ERROR,
  UNKNOWN_ERROR
  // Add additional types of errors as required.
}

// Structure of an Error in the history
// Each error will be stored with its type, the message, and the time it occurred.
interface ErrorHistoryEntry {
  type: ErrorType
  message: string
  timestamp: Date
}

// The state of the store includes the current error message and type,
// and a history of all errors that have occurred.
interface ErrorState {
  message: string | null
  type: ErrorType | null
  history: ErrorHistoryEntry[]
}

export const useErrorStore = defineStore({
  id: 'error',
  state: (): ErrorState => ({
    message: null,
    type: null,
    history: []
  }),
  actions: {
    // Set an error of a specific type and with a specific message.
    // The error is also added to the history.
    setError(type: ErrorType, message: string) {
      const errorEntry: ErrorHistoryEntry = {
        type,
        message,
        timestamp: new Date() // The current time
      }

      // Set the current error message and type
      this.message = message
      this.type = type

      // Add the error to the history
      this.history.push(errorEntry)
    },

    // Clear the current error message and type
    clearError() {
      this.message = null
      this.type = null
    },

    // Handle an error that occurs during an async operation.
    // The type of error and a default error message can be specified.
    // If an error occurs during the async operation, setError() is called.
    async handleError(
      handler: () => Promise<any>,
      type: ErrorType = ErrorType.UNKNOWN_ERROR,
      errorMessage = 'An error occurred'
    ) {
      try {
        // Attempt to perform the async operation
        return await handler()
      } catch (error) {
        // If an error occurs, append its message to the default error message,
        // then set the error in the store and re-throw the error
        if (error instanceof Error) {
          errorMessage += ` Details: ${error.message}`
        }
        this.setError(type, errorMessage)
        throw new Error(errorMessage)
      }
    },

    // Get the history of errors
    getErrorHistory() {
      return this.history
    }
  }
})
