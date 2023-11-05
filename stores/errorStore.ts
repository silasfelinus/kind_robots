// ~/stores/error.ts
import { defineStore } from 'pinia';

export enum ErrorType {
  NETWORK_ERROR,
  VALIDATION_ERROR,
  AUTH_ERROR,
  UNKNOWN_ERROR,
}

export interface ErrorHistoryEntry {
  type: ErrorType;
  message: string;
  timestamp: Date;
}

export const useErrorStore = defineStore('error', {
  state: () => ({
    message: null as string | null,
    type: null as ErrorType | null,
    history: [] as ErrorHistoryEntry[],
  }),
  actions: {
    setError(type: ErrorType, message: unknown) {
      let errorMessage: string;

      if (message instanceof Error) {
        errorMessage = message.message;
      } else if (typeof message === 'string') {
        errorMessage = message;
      } else {
        errorMessage = 'An unknown error occurred';
      }

      const errorEntry: ErrorHistoryEntry = {
        type,
        message: errorMessage,
        timestamp: new Date(),
      };

      this.message = errorMessage;
      this.type = type;
      this.history.push(errorEntry);
    },

    clearError() {
      this.message = null;
      this.type = null;
    },

    async handleError(
      handler: () => Promise<any>,
      type: ErrorType = ErrorType.UNKNOWN_ERROR,
      errorMessage = 'An error occurred',
    ) {
      try {
        return await handler();
      } catch (error) {
        if (error instanceof Error) {
          errorMessage += ` Details: ${error.message}`;
        }
        this.setError(type, errorMessage);
        throw new Error(errorMessage);
      }
    },

    getErrors() {
      return this.history;
    },

    checkConnection() {
      return new Promise((resolve, reject) => {
        if (this.history) {
          // Change this condition based on what indicates a successful "connection"
          resolve(true);
        } else {
          reject(new Error('Cannot connect to Error store.'));
        }
      });
    },
    async loadStore() {
      try {
        await this.getErrors();
        return `loaded ${this.getErrors}. Hopefully there we no errors there.`;
      } catch (error) {
        console.error('Error loading store:', error);
        throw error;
      }
    },
  },
});
