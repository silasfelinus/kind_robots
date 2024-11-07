import { defineStore } from 'pinia';
import { useErrorStore, ErrorType } from './errorStore';
import { useUserStore } from './userStore';
import { performFetch, handleError } from './utils';
import type { Communication } from '@prisma/client';

export const useCommunicationStore = defineStore({
  id: 'communication',
  state: () => ({
    communications: [] as Communication[],
    isInitialized: false,
  }),

  getters: {
    communicationsByUserId: (state) => {
      const userStore = useUserStore();
      return state.communications.filter(
        (comm) => comm.userId === userStore.user?.id
      );
    },
    publicCommunications(state) {
      const userStore = useUserStore();
      return state.communications.filter(
        (comm) => comm.isPublic && comm.userId !== userStore.user?.id
      );
    },
  },

  actions: {
    async initialize() {
      if (this.isInitialized) return;
      try {
        this.loadFromLocalStorage();

        const userStore = useUserStore();
        if (userStore.user?.id) {
          await this.fetchCommunicationsByUserId(userStore.user.id);
        } else {
          handleError(ErrorType.VALIDATION_ERROR, 'User ID not found.');
        }

        this.isInitialized = true;
      } catch (error) {
        handleError(ErrorType.NETWORK_ERROR, `Initialization failed: ${error}`);
      }
    },

    async addCommunication(
      content: string,
      userId: number,
      isPublic: boolean = true
    ) {
      if (!content || !userId) {
        handleError(ErrorType.VALIDATION_ERROR, 'Missing content or userId.');
        return;
      }

      const userStore = useUserStore();

      try {
        const communication: Omit<
          Communication,
          'id' | 'createdAt' | 'updatedAt'
        > = {
          userId,
          username: userStore.username ?? 'Unknown User',
          content,
          isPublic,
        };

        const response = await performFetch<{ newCommunication: Communication }>(
          '/api/communications',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(communication),
          }
        );

        const newCommunication = response.data?.newCommunication;
        if (!newCommunication)
          throw new Error('Failed to create new communication.');

        this.communications.push(newCommunication);
        this.saveToLocalStorage();
        return newCommunication;
      } catch (error) {
        handleError(
          ErrorType.NETWORK_ERROR,
          `Error in addCommunication: ${error}`
        );
        throw error;
      }
    },

    async fetchCommunicationsByUserId(userId: number) {
      try {
        const response = await performFetch<{ userCommunications: Communication[] }>(
          `/api/communications/user/${userId}`
        );
        if (response.success) {
          this.communications = response.data?.userCommunications || [];
          this.saveToLocalStorage();
        } else {
          handleError(ErrorType.NETWORK_ERROR, response.message);
        }
      } catch (error) {
        handleError(
          ErrorType.NETWORK_ERROR,
          `Failed to fetch communications: ${error}`
        );
      }
    },

    async editCommunication(
      communicationId: number,
      updatedData: Partial<Communication>
    ) {
      try {
        const response = await performFetch<{ communication: Communication }>(
          `/api/communications/${communicationId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
          }
        );

        const updatedCommunication = response.data?.communication;
        if (updatedCommunication) {
          this.communications = this.communications.map((comm) =>
            comm.id === communicationId ? updatedCommunication : comm
          );
          this.saveToLocalStorage();
          return updatedCommunication;
        } else {
          throw new Error('Failed to update communication');
        }
      } catch (error) {
        handleError(
          ErrorType.NETWORK_ERROR,
          `Error editing communication: ${error}`
        );
        throw error;
      }
    },

    async deleteCommunication(communicationId: number): Promise<boolean> {
      const userStore = useUserStore();
      const currentUserId = userStore.user?.id;

      if (!currentUserId) {
        handleError(ErrorType.AUTH_ERROR, 'User not authenticated.');
        return false;
      }

      const communication = this.communications.find(
        (comm) => comm.id === communicationId
      );
      if (!communication) {
        handleError(ErrorType.UNKNOWN_ERROR, 'Communication not found.');
        return false;
      }

      if (communication.userId !== currentUserId) {
        handleError(ErrorType.AUTH_ERROR, 'Unauthorized delete attempt.');
        return false;
      }

      try {
        const response = await performFetch(
          `/api/communications/${communicationId}`,
          {
            method: 'DELETE',
          }
        );

        if (response.success) {
          this.communications = this.communications.filter(
            (comm) => comm.id !== communicationId
          );
          this.saveToLocalStorage();
          return true;
        } else {
          throw new Error(response.message || 'Unknown error from API');
        }
      } catch (error) {
        handleError(
          ErrorType.NETWORK_ERROR,
          `Error deleting communication: ${error}`
        );
        return false;
      }
    },

    loadFromLocalStorage() {
      if (typeof window === 'undefined') return;

      const savedCommunications = localStorage.getItem('communications');

      if (savedCommunications) {
        try {
          const parsedCommunications = JSON.parse(savedCommunications);
          if (Array.isArray(parsedCommunications)) {
            this.communications = parsedCommunications.map((comm) => ({
              ...comm,
              createdAt: comm.createdAt ? new Date(comm.createdAt) : new Date(),
              updatedAt: comm.updatedAt ? new Date(comm.updatedAt) : new Date(),
              userId: comm.userId ?? 0,
              username: comm.username || 'Unknown User',
              content: comm.content || 'No content available',
              isPublic: comm.isPublic ?? true,
            }));
          } else {
            console.warn('Invalid data format in localStorage, clearing data.');
            localStorage.removeItem('communications');
            this.communications = [];
          }
        } catch (error) {
          handleError(
            ErrorType.PARSE_ERROR,
            `Failed to parse communications from localStorage: ${error}`
          );
          localStorage.removeItem('communications');
          this.communications = [];
        }
      } else {
        this.communications = [];
      }
    },

    saveToLocalStorage() {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'communications',
          JSON.stringify(this.communications)
        );
      }
    },
  },
});

export type { Communication };
