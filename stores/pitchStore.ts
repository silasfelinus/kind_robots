import { defineStore } from 'pinia'
import { useUserStore } from './userStore'
import { performFetch, handleError } from './utils'
import type { Pitch, Art } from '@prisma/client' // Import as type

export enum PitchType {
  ARTPITCH = 'ARTPITCH',
  BRAINSTORM = 'BRAINSTORM',
  RANDOMLIST = 'RANDOMLIST',
  TITLE = 'TITLE',
  WEIRDLANDIA = 'WEIRDLANDIA',
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
    numberOfRequests: 1,
    temperature: 0.9,
    exampleString: ' ',
    apiResponse: ' ',
    maxTokens: 500,
    selectedPitch: null as Pitch | null,
  }),

  getters: {
    pitchTypes: () => Object.values(PitchType),
    selectedPitchId: (state) => state.selectedPitches[0]?.id || null,
    getPitchesByType: (state) => (pitchType: PitchType) => {
      return state.pitches.filter((pitch) => {
        return pitch.PitchType === pitchType
      })
    },
    getPitchesBySelectedType: (state) =>
      state.selectedPitchType
        ? state.pitches.filter(
            (pitch) => pitch.PitchType === state.selectedPitchType,
          )
        : [],
    randomListPitches: (state) => {
      return state.pitches.filter(
        (pitch) => pitch.PitchType === PitchType.RANDOMLIST,
      )
    },
    async selectPitch(pitchId: number) {
  try {
    if (this.currentPitch?.id === pitchId) return
    const foundPitch = this.pitches.find((pitch) => pitch.id === pitchId)
    if (!foundPitch) throw new Error(`Pitch with ID ${pitchId} not found`)

    this.selectedPitch = foundPitch
    
    
  } catch (error) {
    handleError(error, 'selecting pitch')
  }
},

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
    async initializePitches() {
      if (isClient && !this.isInitialized) {
        const savedState = {
          pitches: localStorage.getItem('pitches'),
          selectedPitches: localStorage.getItem('selectedPitches'),
          selectedPitchType: localStorage.getItem('selectedPitchType'),
          galleryArt: localStorage.getItem('galleryArt'),
          selectedTitle: localStorage.getItem('selectedTitle'),
          newestPitches: localStorage.getItem('newestPitches'),
          numberOfRequests: localStorage.getItem('numberOfRequests'),
          temperature: localStorage.getItem('temperature'),
          exampleString: localStorage.getItem('exampleString'),
          apiResponse: localStorage.getItem('apiResponse'),
          maxTokens: localStorage.getItem('maxTokens'),
        }

        // Load saved state if available
        this.pitches = savedState.pitches ? JSON.parse(savedState.pitches) : []
        this.selectedPitches = savedState.selectedPitches
          ? JSON.parse(savedState.selectedPitches)
          : []
        this.selectedPitchType = savedState.selectedPitchType
          ? JSON.parse(savedState.selectedPitchType)
          : null
        this.galleryArt = savedState.galleryArt
          ? JSON.parse(savedState.galleryArt)
          : []
        this.selectedTitle = savedState.selectedTitle
          ? JSON.parse(savedState.selectedTitle)
          : null
        this.newestPitches = savedState.newestPitches
          ? JSON.parse(savedState.newestPitches)
          : []
        this.numberOfRequests = savedState.numberOfRequests
          ? JSON.parse(savedState.numberOfRequests)
          : 1
        this.temperature = savedState.temperature
          ? Number(JSON.parse(savedState.temperature))
          : 0.9
        this.exampleString = savedState.exampleString || ' '
        this.apiResponse = savedState.apiResponse || ' '
        this.maxTokens = savedState.maxTokens
          ? JSON.parse(savedState.maxTokens)
          : 500

        this.fetchPitches()
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
          this.saveStateToLocalStorage()
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
      this.saveStateToLocalStorage()
    },

    setSelectedPitchType(pitchType: PitchType | null) {
      this.selectedPitchType = pitchType
      this.saveStateToLocalStorage()
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
          this.saveStateToLocalStorage()
        } else {
          console.warn(
            `Title with ID ${titleId} not found or is not of type TITLE`,
          )
        }
      }
    },
    randomEntry(pitchName: string): string {
      // Ensure pitches array exists
      if (!this.pitches || !Array.isArray(this.pitches)) {
        console.error('Pitches array is not defined or invalid.')
        return pitchName
      }

      // Find the matching pitch
      const pitch = this.pitches.find(
        (p) =>
          typeof p.title === 'string' &&
          p.title.toLowerCase() === pitchName.toLowerCase() &&
          p.PitchType === PitchType.RANDOMLIST,
      )

      if (!pitch) {
        console.warn(
          `No matching RANDOMLIST pitch found for "${pitchName}". Returning input as-is.`,
        )
        return pitchName
      }

      // Validate examples property
      if (!pitch.examples || typeof pitch.examples !== 'string') {
        console.warn(
          `Pitch "${pitchName}" has no valid examples defined. Returning input as-is.`,
        )
        return pitchName
      }

      // Split examples and pick a random one
      const examples = pitch.examples
        .split('|')
        .map((example) => example.trim())
      if (examples.length === 0) {
        console.warn(
          `Pitch "${pitchName}" has no examples after splitting. Returning input as-is.`,
        )
        return pitchName
      }

      const randomIndex = Math.floor(Math.random() * examples.length)

      return examples[randomIndex]
    },

    async fetchTitleStormPitches(): Promise<void> {
      const numberOfRequests = this.numberOfRequests || 5
      const maxTokens = this.maxTokens || 500
      const temperature = this.temperature || 0.5
      const exampleString = this.exampleString || this.selectedTitle?.examples

      let compiledContent = ''
      if (this.selectedTitle) {
        compiledContent += `${this.selectedTitle.title}. `
        compiledContent += `${this.selectedTitle.description || ''} `
      } else {
        console.warn('No selected title found. Exiting fetchTitleStormPitches.')
        return
      }

      const requestBody = {
        n: 1,
        content: `Please generate ${numberOfRequests} new and original examples for: ${compiledContent}. Separate examples by a | delimiter, and fully bookend with two delimiters, using this response format: EXAMPLES:||${exampleString}||"`,
        max_tokens: maxTokens,
        temperature: temperature,
      }

      try {
        const response = await performFetch<string>('/api/botcafe/titleStorm', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        })

        if (response.success) {
          this.apiResponse = response.data || 'No response'

          // Create a single new pitch using the full response as examples
          const newPitchData: Partial<Pitch> = {
            title: this.selectedTitle?.title || 'Untitled',
            description: this.selectedTitle?.description || '',
            examples: this.apiResponse,
            PitchType: PitchType.BRAINSTORM,
            pitch: this.apiResponse, // Store the entire AI response as the pitch content
          }

          // Call createPitch to add the new pitch to the store
          const createdPitch = await this.createPitch(newPitchData)
          if (createdPitch && createdPitch.success && createdPitch.data) {
            // Update newestPitches with the newly created pitch
            this.newestPitches = [createdPitch.data]
            this.saveStateToLocalStorage()
          } else {
            console.warn('Failed to create pitch from title storm response.')
          }
        } else {
          console.warn('Title storm fetch failed:', response.message)
          throw new Error(response.message)
        }
      } catch (error) {
        console.error('Error during fetchTitleStormPitches:', error)
        handleError(error, 'fetching title storm pitches')
      }
    },

    async fetchRandomPitches(count: number): Promise<void> {
      try {
        const response = await performFetch<Pitch[]>(
          `/api/pitches/random?count=${count}`,
        )

        if (response.success) {
          this.selectedPitches = response.data || []
          this.saveStateToLocalStorage()
        } else {
          console.warn('Failed to fetch random pitches:', response.message)
          throw new Error(response.message)
        }
      } catch (error) {
        console.error('Error in fetchRandomPitches:', error)
        handleError(error, 'fetching random pitches')
      }
    },

    async fetchBrainstormPitches(): Promise<void> {
      const numberOfRequests = this.numberOfRequests || 5
      const maxTokens = this.maxTokens || 500
      const temperature = this.temperature || 0.5

      let compiledContent = ''
      if (this.selectedTitle) {
        compiledContent += `Title: ${this.selectedTitle.title}\n`
        compiledContent += `Description: ${this.selectedTitle.description || ''}\n`
        compiledContent += `Please provide ${numberOfRequests} examples separated by | delimiters`

        if (this.exampleString) {
          compiledContent += `\nExamples: ||${this.exampleString}||`
        }
      } else {
        console.warn('No selected title found. Exiting fetchBrainstormPitches.')
        return
      }

      const requestBody = {
        n: numberOfRequests,
        content: `Please generate brainstorm ideas for:\n${compiledContent}`,
        max_tokens: maxTokens,
        temperature: temperature,
      }

      try {
        const response = await performFetch<string>('/api/botcafe/brainstorm', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        })

        if (response.success) {
          // Extract the response data for the examples field
          const apiResponse = response.data || ''
          this.apiResponse = apiResponse

          // Create a partial pitch and send to createPitch
          const newPitchData: Partial<Pitch> = {
            title: this.selectedTitle?.title || 'Untitled Pitch',
            description: this.selectedTitle?.description || '',
            examples: apiResponse,
            PitchType: PitchType.BRAINSTORM,
            pitch: apiResponse, // Storing full API response as pitch content for now
          }

          // Use createPitch to handle the new pitch
          const createdPitch = await this.createPitch(newPitchData)
          if (createdPitch && createdPitch.success && createdPitch.data) {
            this.newestPitches = [createdPitch.data]
            this.saveStateToLocalStorage()
          } else {
            console.warn('Failed to create pitch from brainstorm response.')
          }
        } else {
          console.warn('Brainstorm fetch failed:', response.message)
          throw new Error(response.message)
        }
      } catch (error) {
        console.error('Error during fetchBrainstormPitches:', error)
        handleError(error, 'fetching brainstorm pitches')
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

      this.saveStateToLocalStorage()
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
          this.saveStateToLocalStorage()
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
          this.saveStateToLocalStorage()
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
      PitchType = 'TITLE',
    }: Partial<Pitch>) {
      try {
        const userStore = useUserStore()

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
          const data = response.data
          this.saveStateToLocalStorage()
          return { success: true, message: 'Pitch created successfully', data }
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
    async updatePitchExamples(pitchId: number, examplesArray: string[]) {
      const updatedString = examplesArray.join('|')
      await this.updatePitch(pitchId, { examples: updatedString })
      this.saveStateToLocalStorage()
    },
    setSelectedTitle(pitchId: number) {
      this.selectedTitle =
        this.pitches.find((pitch) => pitch.id === pitchId) || null
      this.saveStateToLocalStorage()
    },

    async deletePitch(
      pitchId: number,
    ): Promise<{ success: boolean; message: string }> {
      try {
        const response = await performFetch(`/api/pitches/${pitchId}`, {
          method: 'DELETE',
        })

        if (response.success) {
          // Update the pitches array to exclude the deleted pitch
          this.pitches = this.pitches.filter((pitch) => pitch.id !== pitchId)

          if (isClient) {
            localStorage.setItem('pitches', JSON.stringify(this.pitches))
          }

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
      }
    },

    async fetchArtForPitch(pitchId: number): Promise<void> {
      try {
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

    // Watchers to save updates to local storage whenever properties change
    saveStateToLocalStorage() {
      if (isClient) {
        localStorage.setItem('pitches', JSON.stringify(this.pitches))
        localStorage.setItem(
          'selectedPitches',
          JSON.stringify(this.selectedPitches),
        )
        localStorage.setItem(
          'selectedPitchType',
          JSON.stringify(this.selectedPitchType),
        )
        localStorage.setItem('galleryArt', JSON.stringify(this.galleryArt))
        localStorage.setItem(
          'selectedTitle',
          JSON.stringify(this.selectedTitle),
        )
        localStorage.setItem(
          'newestPitches',
          JSON.stringify(this.newestPitches),
        )
        localStorage.setItem(
          'numberOfRequests',
          JSON.stringify(this.numberOfRequests),
        )
        localStorage.setItem('temperature', String(this.temperature))

        localStorage.setItem('exampleString', this.exampleString)
        localStorage.setItem('apiResponse', this.apiResponse)
        localStorage.setItem('maxTokens', JSON.stringify(this.maxTokens))
      }
    },

    clearLocalStorage() {
      if (isClient) {
        localStorage.removeItem('pitches')
        localStorage.removeItem('selectedPitches')
        localStorage.removeItem('selectedPitchType')
        localStorage.removeItem('galleryArt')
        localStorage.removeItem('selectedTitle')
        localStorage.removeItem('newestPitches')
        localStorage.removeItem('numberOfRequests')
        localStorage.removeItem('temperature')
        localStorage.removeItem('exampleString')
        localStorage.removeItem('apiResponse')
        localStorage.removeItem('maxTokens')
      }
    },
  },
})

export { type Pitch }
