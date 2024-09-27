import { defineStore } from 'pinia'

export enum StatusType {
  ERROR = 'error',
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
}

export interface StatusHistoryEntry {
  type: StatusType
  message: string
  timestamp: Date
}

interface StatusState {
  message: string | null
  type: StatusType | null // Use the enum for the type here
  history: StatusHistoryEntry[],
  isLoading: boolean
}

export const useStatusStore = defineStore('status', {
  state: (): StatusState => ({
    message: null,
    type: null,
    history: [],
    isLoading: false,
  }),
  actions: {
    addStatus(status: { message: string; type: StatusType }) {
      const newStatus: StatusHistoryEntry = {
        message: status.message,
        type: status.type,
        timestamp: new Date(),
      }

      this.message = status.message
      this.type = status.type
      this.history.push(newStatus)
    },

    setStatus(type: StatusType, message: string) {
      const statusEntry: StatusHistoryEntry = {
        type,
        message,
        timestamp: new Date(),
      }

      this.message = message
      this.type = type
      this.history.push(statusEntry)

      return statusEntry
    },

    clearStatus() {
      this.message = null
      this.type = null
    },

    getStatusHistory() {
      return this.history
    },

    async loadStore() {
      this.isLoading = true
      try {
        this.getStatusHistory() // No need for await here
        this.isLoading = false
        return `Loaded ${this.history.length} statuses.`
      } catch (error) {
        console.error('Error loading store:', error)
        this.isLoading = false
        throw error
      }
    },
  },
})
