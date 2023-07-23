// ~/stores/statusStore.ts
import { defineStore } from 'pinia'
import { useErrorStore } from './errorStore'

// Define the types of status that can occur in your application.
export enum StatusType {
  ERROR,
  INFO,
  SUCCESS,
  WARNING
}

// Structure of a Status in the history
interface StatusHistoryEntry {
  type: StatusType
  message: string
  timestamp: Date
}

// The state of the store includes the current status message and type,
// and a history of all statuses that have occurred.
interface StatusState {
  message: string | null
  type: StatusType | null
  history: StatusHistoryEntry[]
}

export const useStatusStore = defineStore({
  id: 'status',
  state: (): StatusState => ({
    message: null,
    type: null,
    history: []
  }),
  actions: {
    // Initialize the store
    onInitialize() {
      const errorStore = useErrorStore()

      // Watch the error store for changes
      watch(
        () => errorStore.message,
        (message) => {
          if (message) {
            this.setStatus(StatusType.ERROR, message)
          }
        }
      )
    },
    // Set a status of a specific type and with a specific message.
    // The status is also added to the history.
    setStatus(type: StatusType, message: string) {
      const statusEntry: StatusHistoryEntry = {
        type,
        message,
        timestamp: new Date() // The current time
      }

      // Set the current status message and type
      this.message = message
      this.type = type

      // Add the status to the history
      this.history.push(statusEntry)
    },

    // Clear the current status message and type
    clearStatus() {
      this.message = null
      this.type = null
    },

    // Get the history of statuses
    getStatusHistory() {
      return this.history
    }
  }
})
