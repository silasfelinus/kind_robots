import { defineStore } from 'pinia'
import { performFetch, handleError } from './utils'
import type { Character } from '@prisma/client'

export const useCharacterStore = defineStore({
  id: 'characterStore',
  state: () => ({
    characters: [] as Character[], // Array of all fetched characters
    selectedCharacter: null as Character | null, // Currently selected character
    characterForm: {} as Partial<Character>, // Character being modified in a form
    newCharacter: {} as Partial<Character>, // New character creation placeholder
    loading: false,
    error: '',
    isInitialized: false,
  }),
  actions: {
    // Initialize the store
    async initialize() {
      console.log('Initializing character store...')
      if (this.isInitialized) return
      this.loading = true
      try {
        await this.loadLocalData()
        await this.fetchCharacters()
        this.isInitialized = true
        console.log('Character store initialized.')
      } catch (error) {
        handleError(error, 'initializing character store')
      } finally {
        this.loading = false
      }
    },

    // Fetch all characters from the server
    async fetchCharacters() {
      try {
        const response = await performFetch<{ data: Character[] }>('/api/characters')
        if (response.success && response.data) {
          this.characters = response.data
          this.saveToLocalStorage() // Save to local storage
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'fetching characters')
      }
    },

    // Save a new character
    async saveCharacter(character: Partial<Character>) {
      try {
        const response = await performFetch<Character>('/api/characters', {
          method: 'POST',
          body: JSON.stringify(character),
          headers: { 'Content-Type': 'application/json' },
        })
        if (response.success && response.data) {
          this.characters.push(response.data)
          this.selectedCharacter = response.data
          this.saveToLocalStorage() // Update local storage
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'saving character')
      }
    },

    // Load a single character by ID
    async loadCharacter(id: number) {
      try {
        const response = await performFetch<Character>(`/api/characters/${id}`)
        if (response.success && response.data) {
          this.selectedCharacter = response.data
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'loading character')
      }
    },

    // Delete a character
    async deleteCharacter(id: number) {
      try {
        const response = await performFetch(`/api/characters/${id}`, {
          method: 'DELETE',
        })
        if (response.success) {
          this.characters = this.characters.filter(
            (character) => character.id !== id,
          )
          if (this.selectedCharacter?.id === id) {
            this.selectedCharacter = null
          }
          this.saveToLocalStorage() // Update local storage
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'deleting character')
      }
    },

    // Patch a character (partial update)
    async patchCharacter(id: number, updates: Partial<Character>) {
      try {
        const response = await performFetch<Character>(`/api/characters/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
          headers: { 'Content-Type': 'application/json' },
        })
        if (response.success && response.data) {
          this.characters = this.characters.map((char) =>
            char.id === id ? response.data : char,
          )
          if (this.selectedCharacter?.id === id) {
            this.selectedCharacter = response.data
          }
          this.saveToLocalStorage() // Update local storage
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'patching character')
      }
    },

    // Generate a character image
    async generateCharacterImage(characterId: number, prompt: string) {
      const artStore = useArtStore()
      try {
        const generatedArt = await artStore.generateArt({ promptString: prompt })
        if (generatedArt.success && generatedArt.data) {
          await this.patchCharacter(characterId, {
            artImageId: generatedArt.data.artImageId,
          })
        } else {
          throw new Error('Failed to generate character image.')
        }
      } catch (error) {
        handleError(error, 'generating character image')
      }
    },

    // Update a character with a submission
    async updateCharacterWithSubmission(
      baseCharacter: Character,
      updates: Partial<Character>,
    ) {
      try {
        // Create a new character with the updated properties
        const newSubmission = { ...baseCharacter, ...updates }
        delete newSubmission.id // Remove ID to create a new character

        const response = await performFetch<Character>('/api/characters', {
          method: 'POST',
          body: JSON.stringify(newSubmission),
          headers: { 'Content-Type': 'application/json' },
        })

        if (response.success && response.data) {
          this.characters.push(response.data)
          this.selectedCharacter = response.data
          this.saveToLocalStorage() // Update local storage
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'updating character with submission')
      }
    },

    // Load data from localStorage
    loadLocalData() {
      try {
        const storedCharacters = localStorage.getItem('characters')
        if (storedCharacters) {
          this.characters = JSON.parse(storedCharacters)
        }
        const storedSelectedCharacter = localStorage.getItem('selectedCharacter')
        if (storedSelectedCharacter) {
          this.selectedCharacter = JSON.parse(storedSelectedCharacter)
        }
      } catch (error) {
        handleError(error, 'loading local data')
      }
    },

    // Save data to localStorage
    saveToLocalStorage() {
      try {
        localStorage.setItem('characters', JSON.stringify(this.characters))
        if (this.selectedCharacter) {
          localStorage.setItem(
            'selectedCharacter',
            JSON.stringify(this.selectedCharacter),
          )
        }
      } catch (error) {
        handleError(error, 'saving to local data')
      }
    },

    // Form management
    setCharacterForm(character: Partial<Character>) {
      this.characterForm = { ...character }
    },

    clearCharacterForm() {
      this.characterForm = {}
    },
  },
})
