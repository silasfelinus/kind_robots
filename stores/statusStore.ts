import { defineStore } from 'pinia'

export enum StatusType {
  ERROR,
  INFO,
  SUCCESS,
  WARNING,
}

export interface StatusHistoryEntry {
  type: StatusType
  message: string
  timestamp: Date
}

export const useStatusStore = defineStore('status', {
  state: () => ({
    message: 'Idle' as string | null, 
    type: null as StatusType | null,
    history: [] as StatusHistoryEntry[],
    isLoading: false,
  }),
  actions: {
    setStatus(type: StatusType, message: string) {
      const statusEntry: StatusHistoryEntry = {
        type,
        message,
        timestamp: new Date(),
      };

      this.message = message;
      this.type = type;
      this.history.push(statusEntry);

      return statusEntry; // Return the status entry
    },

    clearStatus() {
      this.message = null;
      this.type = null;
    },

    getStatusHistory() {
      return this.history;
    },

    async loadStore() {
      this.isLoading = true;
      try {
        this.getStatusHistory();  // No need for await here
        this.isLoading = false;
        return `Loaded ${this.history.length} statuses.`;
      } catch (error) {
        console.error('Error loading store:', error);
        this.isLoading = false;
        throw error;
      }
    },
  },
});
