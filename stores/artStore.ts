import { defineStore } from 'pinia'
import type { Art, Reaction, ArtImage, Tag } from '@prisma/client'
import { useErrorStore, ErrorType } from './../stores/errorStore'

const isClient = typeof window !== 'undefined'; // Check if running in a browser environment

export const useArtStore = defineStore({
  id: 'artStore',
  state: () => ({
    art: [] as Art[],
    reactions: [] as Reaction[],
    tags: [] as Tag[],
    artImages: [] as ArtImage[],
    loading: false,
    error: '',
    currentArt: null as Art | null,
    pitch: '',
    collectedArt: [] as Art[], // Store user's collected art
    isInitialized: false, // Boolean to ensure initialization happens once
  }),
  actions: {
    // Initialize the artStore and load data from localStorage if available
    async initialize(userId: number) {
      const errorStore = useErrorStore();

      // Skip if already initialized
      if (this.isInitialized) return;

      this.loading = true;

      try {
        // Check if we're running in a browser environment
        if (isClient) {
          // Load art from localStorage if available
          const storedArt = localStorage.getItem('art');
          if (storedArt) {
            this.art = JSON.parse(storedArt);
          }

          // Load collected art from localStorage if available
          const storedCollectedArt = localStorage.getItem('collectedArt');
          if (storedCollectedArt) {
            this.collectedArt = JSON.parse(storedCollectedArt);
          }
        }

        // Fetch user's collected art from API
        await this.fetchCollectedArt(userId);

        // Fetch all art if not loaded from localStorage
        if (this.art.length === 0) {
          await this.fetchAllArt();
        }

        this.isInitialized = true; // Mark the store as initialized
      } catch (error: unknown) {
        if (error instanceof Error) {
          errorStore.setError(ErrorType.STORE_ERROR, error.message);
        } else {
          errorStore.setError(ErrorType.STORE_ERROR, 'An error occurred during initialization.');
        }
      } finally {
        this.loading = false;
      }
    },

    // Fetch a user's collected art
    async fetchCollectedArt(userId: number): Promise<void> {
      const errorStore = useErrorStore();
      return errorStore.handleError(
        async () => {
          const response = await fetch(`/api/art/user/${userId}/collected`);
          if (response.ok) {
            const data = await response.json();
            this.collectedArt = data.collectedArt as Art[]; // Store collected art

            // Store collected art in localStorage
            if (isClient) {
              localStorage.setItem('collectedArt', JSON.stringify(this.collectedArt));
            }
          } else {
            const errorResponse = await response.json();
            throw new Error(errorResponse.message);
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch collected art.'
      );
    },

    async fetchAllArt(): Promise<void> {
      const errorStore = useErrorStore();
      return errorStore.handleError(
        async () => {
          const response = await fetch('/api/art');
          if (response.ok) {
            const data = await response.json();
            this.art = data.artEntries as Art[];

            // Store art in localStorage
            if (isClient) {
              localStorage.setItem('art', JSON.stringify(this.art));
            }
          } else {
            const errorResponse = await response.json();
            throw new Error(errorResponse.message);
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch art.'
      );
    },

    selectArt(artId: number) {
      const foundArt = this.art.find((art: Art) => art.id === artId)
      this.currentArt = foundArt || null
      if (!foundArt) {
        console.warn(`Art with id ${artId} not found.`)
      }
    },
    async fetchArtByUserId(userId: number): Promise<void> {
      const errorStore = useErrorStore();
      try {
        const response = await fetch(`/api/art/user/${userId}`);
        if (!response.ok) {
          const errorResponse = await response.json();
          throw new Error(errorResponse.message);
        }
        const data = await response.json();
        this.art = data.art as Art[];
      } catch (error: unknown) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          error instanceof Error ? error.message : 'An unexpected error occurred'
        );
      }
    },



    // Add an art piece to the user's collection
    async addArtToCollection(userId: number, artId: number): Promise<void> {
      const errorStore = useErrorStore();
      return errorStore.handleError(
        async () => {
          const response = await fetch(`/api/art/collection/${userId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'add', artId }),
          });

          if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(errorResponse.message);
          }

          // Refetch the updated collected art after adding
          await this.fetchCollectedArt(userId);
        },
        ErrorType.NETWORK_ERROR,
        'Failed to add art to the collection.'
      );
    },

    // Remove an art piece from the user's collection
    async removeArtFromCollection(userId: number, artId: number): Promise<void> {
      const errorStore = useErrorStore();
      return errorStore.handleError(
        async () => {
          const response = await fetch(`/api/art/collection/${userId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'remove', artId }),
          });

          if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(errorResponse.message);
          }

          // Refetch the updated collected art after removing
          await this.fetchCollectedArt(userId);
        },
        ErrorType.NETWORK_ERROR,
        'Failed to remove art from the collection.'
      );
    },

    getArtById(id: number): Art | undefined {
      return this.art.find((art: Art) => art.id === id)
    },

    getTagsById(id: number): Tag | undefined {
      return this.tags.find((tag: Tag) => tag.id === id)
    },

    getArtImagesById(artId: number): ArtImage[] {
      return this.artImages.filter((image: ArtImage) => image.artId === artId)
    },

    getReactionsById(id: number): Reaction[] {
      return this.reactions.filter(
        (reaction: Reaction) => reaction.artId === id,
      )
    },

    async deleteArt(id: number) {
      const errorStore = useErrorStore();
      return errorStore.handleError(
        async () => {
          const response = await fetch(`/api/art/${id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            this.art = this.art.filter((art: Art) => art.id !== id);
            if (isClient) {
              localStorage.setItem('art', JSON.stringify(this.art));
            }
          } else {
            const errorResponse = await response.json();
            throw new Error(errorResponse.message);
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to delete art.',
      );
    },

    getArtByPitchId(pitchId: number): Art[] {
      return this.art.filter((art: Art) => art.pitchId === pitchId)
    },

    async fetchArtById(id: number): Promise<Art | null> {
      const errorStore = useErrorStore();
      return errorStore.handleError(
        async () => {
          const response = await fetch(`/api/art/${id}`);
          if (response.ok) {
            return await response.json();
          } else {
            return null;
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch art by ID.',
      );
    },

    async generateArt(
      data: GenerateArtData,
    ): Promise<{ success: boolean; message?: string; newArt?: Art }> {
      const errorStore = useErrorStore();
      this.loading = true;
      this.currentArt = null; // Reset the art
      this.error = '';
    
      return errorStore.handleError(
        async () => {
          const response = await fetch('/api/art/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
          if (response.ok) {
            const result = await response.json();
            this.currentArt = result.art;
            return { success: true, art: result.art };
          } else {
            const errorResponse = await response.json();
            return { success: false, message: errorResponse.message };
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to generate art.',
      ).finally(() => {
        this.loading = false;
      });
    },
  },
});

export type { Art, ArtImage }
