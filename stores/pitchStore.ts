import { defineStore } from 'pinia';
import type { Pitch } from '@prisma/client';
import { useUserStore } from './../stores/userStore';
import type { Art } from './../stores/artStore';
import { useErrorStore, ErrorType } from './../stores/errorStore'; // Import useErrorStore and ErrorType

const isClient = typeof window !== 'undefined';

interface FetchResponse {
  pitch?: Pitch;
  pitches?: Pitch[]; // Added if your API returns an array of pitches.
  message?: string;
  success: boolean;
}

interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (error as ErrorWithMessage).message !== undefined;
}


export const usePitchStore = defineStore('pitch', {
  state: () => ({
    pitches: [] as Pitch[],
    isInitialized: false,
    selectedPitch: null as Pitch | null,
    selectedPitches: [] as Pitch[],
    galleryArt: [] as Art[],
  }),

  getters: {
    publicPitches(state): Pitch[] {
      const userStore = useUserStore();
      return state.pitches.filter(
        (pitch) => pitch.isPublic || pitch.userId === userStore.userId || pitch.userId === 0,
      );
    },
  },

  actions: {
    async performFetch(url: string, options: RequestInit = {}): Promise<FetchResponse> {
      const errorStore = useErrorStore();
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          const errorData: FetchResponse = await response.json();
          throw new Error(errorData.message || 'Failed to perform fetch operation');
        }
        return await response.json() as FetchResponse;
      } catch (error: unknown) {
        if (isErrorWithMessage(error)) {
          errorStore.setError(ErrorType.NETWORK_ERROR, error.message);
          console.error('Network error:', error.message);
        } else {
          errorStore.setError(ErrorType.NETWORK_ERROR, 'Unknown network error');
          console.error('Network error: Unknown error');
        }
        throw error;
      }
    },
    

    async initializePitches() {
      if (!this.isInitialized) {
        await this.fetchPitches();
        this.isInitialized = true;
      }
    },
    async fetchPitches() {
      try {
        const data = await this.performFetch('/api/pitches/batch');
        this.pitches = data.pitches || []; // Ensure we default to an empty array if undefined
        if (isClient) {
          localStorage.setItem('pitches', JSON.stringify(this.pitches));
        }
      } catch (error) {
        console.error('Failed to fetch pitches:', error);
      }
    },
    

    async createPitch(newPitch: Partial<Pitch>) {
      try {
        const data = await this.performFetch('/api/pitches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPitch),
        });
        if (data.pitch) {
          this.pitches.push(data.pitch);
          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches));
          }
          return { success: true, message: 'Pitch created successfully' };
        } else {
          throw new Error('Pitch creation failed: No pitch returned');
        }
      } catch (error: unknown) {
        if (isErrorWithMessage(error)) {
          console.error('Error creating pitch:', error.message);
          return { success: false, message: error.message };
        } else {
          console.error('Error creating pitch: Unknown error');
          return { success: false, message: 'Unknown error during pitch creation' };
        }
      }
    },
    
    

    async updatePitch(id: number, updates: Partial<Pitch>) {
      try {
        const updatedData = await this.performFetch(`/api/pitches/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        const index = this.pitches.findIndex((pitch) => pitch.id === id);
        if (index !== -1 && updatedData.pitch) {
          this.pitches[index] = { ...this.pitches[index], ...updatedData.pitch };
          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches));
          }
        }
      } catch (error: unknown) {
        console.error('Error updating pitch:', error);
      }
    },

    async deletePitch(id: number) {
      try {
        await this.performFetch(`/api/pitches/${id}`, { method: 'DELETE' });
        const index = this.pitches.findIndex((pitch) => pitch.id === id);
        if (index !== -1) {
          this.pitches.splice(index, 1);
          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches));
          }
        }
      } catch (error) {
        console.error('Error deleting pitch:', error);
      }
    },
  },
});

export { type Pitch };
