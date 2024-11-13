import { defineStore } from 'pinia'
import { useUserStore } from './userStore'
import { usePromptStore } from './promptStore'
import { performFetch, handleError } from './utils'
import type { Pitch, Art } from '@prisma/client' // Import as type

export enum PitchType {
  ARTPITCH = 'ARTPITCH',
  BRAINSTORM = 'BRAINSTORM',
  BOT = 'BOT',
  ARTGALLERY = 'ARTGALLERY',
  INSPIRATION = 'INSPIRATION',
  RANDOMLIST = 'RANDOMLIST',
  TEXTPITCH = 'TEXTPITCH',
  TITLE = 'TITLE',
}
const isClient = typeof window !== 'undefined'

export const usePitchStore = defineStore('pitch', {
  state: () => ({
    pitches: [] as Pitch[],
    selectedPitches: [] as Pitch[],
    selectedPitchType: null as PitchType | null,
    isInitialized: false,
    galleryArt: [] as Art[],
    selectedTitle: null as Pitch | null,
    newestPitches: [] as Pitch[], // New array to hold the latest pitches received
    loading: false,
    numberOfRequests: 5,
    temperature: 0.9,
    penetration: 5,
    exampleString: ' ',
  }),

  getters: {
    pitchTypes: () => Object.values(PitchType),
    selectedPitch: (state) => state.selectedPitches[0] || null,
    selectedPitchId: (state) => state.selectedPitches[0]?.id || null,
    getPitchesByType: (state) => (pitchType: PitchType) => {
      console.log('Filtering by PitchType:', pitchType)
      return state.pitches.filter((pitch) => {
        console.log('PitchType in pitch:', pitch.PitchType)
        return pitch.PitchType === pitchType
      })
    },
    getPitchesBySelectedType: (state) =>
      state.selectedPitchType
        ? state.pitches.filter(
            (pitch) => pitch.PitchType === state.selectedPitchType,
          )
        : [],
    brainstormPitches: (state) =>
      state.pitches.filter((pitch) => pitch.PitchType === PitchType.BRAINSTORM),
    titles: (state) =>
      state.pitches.filter((pitch) => pitch.PitchType === PitchType.TITLE),
    pitchesByTitle: (state) =>
      state.pitches.reduce((grouped: Record<string, Pitch[]>, pitch) => {
        const title = pitch.title || 'Untitled'
        grouped[title] = grouped[title] || []
        grouped[title].push(pitch)
        return grouped
      }, {}),
    publicPitches: (state) => {
      const userStore = useUserStore()
      return state.pitches.filter(
        (pitch) =>
          pitch.isPublic ||
          pitch.userId === userStore.userId ||
          pitch.userId === 0,
      )
    },
    selectedTitlePitches: (state) =>
      state.selectedTitle
        ? state.pitches.filter(
            (pitch) => pitch.title === state.selectedTitle?.title,
          )
        : [],

    // 4. Newest Pitches: Style returned newest pitches differently
    newestPitchesDisplay: (state) =>
      state.newestPitches.map((pitch) => ({
        ...pitch,
        isNewest: true,
      })),
  },

  actions: {
    // Add this to the actions section
    async initializePitches() {
      console.log('initializing')
      if (isClient && !this.isInitialized) {
        console.log(
          'running fetch pitches, as we are client and not initialized',
        )
        await this.fetchPitches()
        this.isInitialized = true
      }
    },


    async addTitle(newTitleData: {
      title: string
      PitchType: PitchType
      pitch?: string
    }) {
      try {
        // Set `pitch` to match `title` for TITLE-type pitches
        if (newTitleData.PitchType === PitchType.TITLE) {
          newTitleData = {
            ...newTitleData,
            pitch: newTitleData.title, // Ensure `pitch` holds the same value as `title`
          }
        }

        const response = await performFetch<Pitch>('/api/pitches', {
          method: 'POST',
          body: JSON.stringify(newTitleData),
        })

        if (response.success && response.data) {
          this.pitches.push(response.data)
          return { success: true, message: 'Title created successfully' }
        } else {
          return {
            success: false,
            message: response.message || 'Failed to create title',
          }
        }
      } catch (error) {
        handleError(error, 'creating title')
        return { success: false, message: 'Failed to create title' }
      }
    },
    setSelectedPitch(pitchId: number) {
      const pitch = this.pitches.find((p) => p.id === pitchId)
      if (pitch) this.selectedPitches = [pitch]
    },

    setSelectedPitchType(pitchType: PitchType | null) {
      this.selectedPitchType = pitchType
    },

    setTitle(titleId: number | null) {
      if (titleId === null) {
        this.selectedTitle = null
      } else {
        const title = this.pitches.find(
          (pitch) =>
            pitch.id === titleId && pitch.PitchType === PitchType.TITLE,
        )
        if (title) {
          this.selectedTitle = title
        } else {
          console.warn(
            `Title with ID ${titleId} not found or is not of type TITLE`,
          )
        }
      }
    },

    async fetchRandomPitches(count: number): Promise<void> {
      try {
        console.log('Starting fetchRandomPitches...')
        const response = await performFetch<Pitch[]>(
          `/api/pitches/random?count=${count}`,
        )

        if (response.success) {
          this.selectedPitches = response.data || []
        } else {
          console.warn('Failed to fetch random pitches:', response.message)
          throw new Error(response.message)
        }
      } catch (error) {
        console.error('Error in fetchRandomPitches:', error)
        handleError(error, 'fetching random pitches')
      } finally {
        console.log('fetchRandomPitches completed.')
      }
    },

 async fetchBrainstormPitches(): Promise<void> {
  const promptStore = usePromptStore()
  const numberOfRequests = this.numberOfRequests || 5 // Default to 5 if not set

  // Compile content from selectedTitle and exampleString
  let compiledContent = ''
  if (this.selectedTitle) {
    console.log('Selected title found:', this.selectedTitle.title)
    compiledContent += `Title: ${this.selectedTitle.title}\n`
    compiledContent += `Description: ${this.selectedTitle.description || ''}\n`

    // Use exampleString directly, splitting it by '|'
    const examples = this.exampleString ? this.exampleString.split('|') : []
    compiledContent += `Examples:\n${examples.map((example, i) => `Example ${i + 1}: ${example}`).join('\n')}`
  } else {
    console.warn('No selected title found. Exiting fetchBrainstormPitches.')
    return
  }

  const requestBody = {
    n: numberOfRequests, // Dynamic number of requests
    content: `Please generate brainstorm ideas for:\n${compiledContent}`,
    max_tokens: 500,
    temperature: this.temperature,
  }

  try {
    console.log('Sending brainstorm request:', requestBody)
    const response = await performFetch<Pitch[]>('/api/botcafe/brainstorm', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    if (response.success) {
      console.log('Brainstorm fetch successful. Parsing response...')
      const newPitches = response.data || []
      this.addPitches(newPitches)
      console.log('New pitches added:', newPitches)
    } else {
      console.warn('Brainstorm fetch failed:', response.message)
      throw new Error(response.message)
    }
  } catch (error) {
    console.error('Error during fetchBrainstormPitches:', error)
    handleError(error, 'fetching brainstorm pitches')
  } finally {
    console.log('fetchBrainstormPitches operation completed.')
  }
},


    addPitches(newPitches: Pitch[]) {
      const pitchesToAdd = newPitches.filter(
        (newPitch) => !this.pitches.find((pitch) => pitch.id === newPitch.id),
      )

      this.pitches.push(...pitchesToAdd)

      const brainstormPitches = this.pitches
        .filter((pitch) => pitch.PitchType === PitchType.BRAINSTORM)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))

      // Do not auto-select new pitches; update selectedPitches only with the latest brainstorm pitches
      this.selectedPitches = brainstormPitches.slice(0, 5)

      if (isClient) {
        localStorage.setItem('pitches', JSON.stringify(this.pitches))
        localStorage.setItem(
          'selectedPitches',
          JSON.stringify(this.selectedPitches),
        )
      }
    },

    async fetchPitches(): Promise<void> {
      if (this.isInitialized) return
      this.loading = true

      try {
        
        const response = await performFetch<Pitch[]>('/api/pitches')

        if (response.success) {
          
          this.pitches =
            response.data?.map((pitch) => ({
              ...pitch,
              PitchType:
                PitchType[pitch.PitchType as keyof typeof PitchType] ||
                pitch.PitchType,
            })) || []
          this.isInitialized = true
          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
          }
        } else {
          console.warn('Failed to fetch pitches:', response.message)
          throw new Error(response.message)
        }
      } catch (error) {
        console.error('Error in fetchPitches:', error)
        handleError(error, 'fetching pitches')
      } finally {
        this.loading = false
        
      }
    },
    async fetchPitchById(
      pitchId: number,
    ): Promise<{ success: boolean; data?: Pitch; message?: string }> {
      try {
        
        const response = await performFetch<Pitch>(`/api/pitches/${pitchId}`)

        if (response.success && response.data) {
          // Avoid duplicates by checking if the pitch already exists
          const existingPitch = this.pitches.find(
            (pitch) => pitch.id === pitchId,
          )
          if (!existingPitch) {
            this.pitches.push(response.data)
          }

          
          return { success: true, data: response.data }
        } else {
          console.warn(`Failed to fetch pitch by ID: ${response.message}`)
          throw new Error(response.message || 'Pitch not found')
        }
      } catch (error) {
        console.error(`Error in fetchPitchById for pitchId ${pitchId}:`, error)
        handleError(error, 'fetching pitch by ID')
        return {
          success: false,
          message: `Failed to fetch pitch: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }
      } finally {
        console.log(`fetchPitchById completed for pitchId: ${pitchId}`)
      }
    },

    async createPitch({
      title = 'Untitled Pitch',
      pitch = 'This is a sample pitch text',
      designer = null,
      flavorText = null,
      highlightImage = null,
      isMature = false,
      isPublic = true,
      imagePrompt = null,
      description = null,
      examples = null,
      artImageId = null,
    }: Partial<Pitch>) {
      try {
        const userStore = useUserStore()

        // Use the current pitch type from the store
        const PitchType = this.selectedPitchType || 'ARTPITCH'

        const newPitch = {
          userId: userStore.userId || 10,
          title,
          pitch,
          PitchType,
          designer,
          flavorText,
          highlightImage,
          isMature,
          isPublic,
          imagePrompt,
          description,
          examples,
          artImageId,
        }

        const response = await performFetch<Pitch>('/api/pitches', {
          method: 'POST',
          body: JSON.stringify(newPitch),
        })

        if (response.success && response.data) {
          // Add the newly created pitch to the store
          this.pitches.push(response.data)
          this.clearLocalStorage() // Update local storage after data modification
          return { success: true, message: 'Pitch created successfully' }
        } else {
          useErrorStore().setError(
            ErrorType.NETWORK_ERROR,
            response.message || 'Failed to create pitch',
          )
          return {
            success: false,
            message: response.message || 'Failed to create pitch',
          }
        }
      } catch (error) {
        handleError(error, 'creating pitch')
        return {
          success: false,
          message: 'An error occurred while creating pitch',
        }
      }
    },

    // In pitchStore.ts
    async updatePitch(
      pitchId: number,
      updates: Partial<Pitch>,
    ): Promise<{ success: boolean; message: string }> {
      try {
        const response = await performFetch<Pitch>(`/api/pitches/${pitchId}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        })

        const index = this.pitches.findIndex((pitch) => pitch.id === pitchId)

        if (response.success && response.data && index !== -1) {
          this.pitches[index] = { ...this.pitches[index], ...response.data }

          if (typeof window !== 'undefined') {
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
          }

          return { success: true, message: 'Pitch updated successfully' }
        }

        throw new Error(response.message || 'Pitch update failed')
      } catch (error) {
        handleError(error, 'updating pitch')
        return {
          success: false,
          message: 'An error occurred while updating the pitch',
        }
      }
    },

    async deletePitch(
      pitchId: number,
    ): Promise<{ success: boolean; message: string }> {
      try {
        console.log(`Starting deletePitch for pitchId: ${pitchId}`)
        const response = await performFetch(`/api/pitches/${pitchId}`, {
          method: 'DELETE',
        })

        if (response.success) {
          // Update the pitches array to exclude the deleted pitch
          this.pitches = this.pitches.filter((pitch) => pitch.id !== pitchId)

          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
          }

          console.log(`Pitch deleted successfully: pitchId ${pitchId}`)
          return { success: true, message: 'Pitch deleted successfully' }
        } else {
          console.warn(`Failed to delete pitch: ${response.message}`)
          throw new Error(response.message || 'Pitch delete failed')
        }
      } catch (error) {
        console.error(`Error in deletePitch for pitchId ${pitchId}:`, error)
        handleError(error, 'deleting pitch')
        return {
          success: false,
          message: `Failed to delete pitch: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }
      } finally {
        console.log(`deletePitch completed for pitchId: ${pitchId}`)
      }
    },

    async fetchArtForPitch(pitchId: number): Promise<void> {
      try {
        console.log(`Starting fetchArtForPitch for pitchId: ${pitchId}`)
        const response = await performFetch<Art[]>(
          `/api/pitches/art/${pitchId}`,
        )

        if (response.success) {
          this.galleryArt = response.data || [] // Fallback to an empty array if response.data is undefined
        } else {
          console.warn('Failed to fetch art for pitch:', response.message)
          throw new Error(response.message)
        }
      } catch (error) {
        console.error('Error in fetchArtForPitch:', error)
        handleError(error, 'fetching art for pitch')
      } finally {
        console.log(`fetchArtForPitch completed for pitchId: ${pitchId}`)
      }
    },

    // New utility function for clearing local storage when data changes
    clearLocalStorage() {
      if (isClient) {
        localStorage.removeItem('pitches')
        localStorage.removeItem('selectedPitches')
        localStorage.setItem('pitches', JSON.stringify(this.pitches))
        localStorage.setItem(
          'selectedPitches',
          JSON.stringify(this.selectedPitches),
        )
      }
    },
  },
})

export { type Pitch }
