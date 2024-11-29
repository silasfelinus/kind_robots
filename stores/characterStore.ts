import { defineStore } from 'pinia'
import type { Character } from '@prisma/client'
import { performFetch, handleError } from './../stores/utils'

export const useCharacterStore = defineStore({
  id: 'characterStore',

  state: () => ({
    characters: JSON.parse(localStorage.getItem('characters') || '[]') as Character[], // All fetched characters
    newCharacter: null as Partial<Character> | null, // A new character being created
    selectedCharacter: null as Character | null, // Currently selected character
    characterForm: null as Partial<Character> | null, // Temporary character edits or drafts
    loading: false,
    error: '',
  }),

  actions: {
    syncToLocalStorage() {
      try {
        localStorage.setItem('characters', JSON.stringify(this.characters))
      } catch (error) {
        console.error('Error syncing to localStorage:', error)
      }
    },

    async initialize() {
      console.log('Initializing character store...')
      try {
        await this.fetchCharacters()
        console.log('Character store initialized successfully.')
      } catch (error) {
        handleError(error, 'initializing character store')
      }
    },

    async fetchCharacters() {
      try {
        this.loading = true
        const response = await performFetch<{ data: Character[] }>(
          '/api/characters',
        )
        if (response.success && response.data) {
          this.characters = response.data
          console.log('Fetched characters:', this.characters)
          this.syncToLocalStorage()
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'fetching characters')
      } finally {
        this.loading = false
      }
    },

    selectCharacter(id: number) {
      const character = this.characters.find((c) => c.id === id) || null
      if (!character) {
        console.warn(`Character with ID ${id} not found.`)
      }
      this.selectedCharacter = character
    },

    async fetchCharacterById(id: number) {
      try {
        this.loading = true
        const response = await performFetch<{ data: Character }>(
          `/api/characters/${id}`,
        )
        if (response.success && response.data) {
          this.selectedCharacter = response.data
          console.log(`Fetched character with ID ${id}:`, this.selectedCharacter)
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, `fetching character with ID ${id}`)
      } finally {
        this.loading = false
      }
    },

    async createCharacter(character: Partial<Character>) {
      try {
        this.loading = true
        const response = await performFetch<{ data: Character }>(
          '/api/characters',
          {
            method: 'POST',
            body: JSON.stringify(character),
            headers: { 'Content-Type': 'application/json' },
          },
        )
        if (response.success && response.data) {
          this.characters.push(response.data)
          console.log('Character created successfully:', response.data)
          this.syncToLocalStorage()
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'creating character')
      } finally {
        this.loading = false
      }
    },

    async updateCharacter(id: number, characterUpdates: Partial<Character>) {
      try {
        this.loading = true
        const response = await performFetch<{ data: Character }>(
          `/api/characters/${id}`,
          {
            method: 'PATCH',
            body: JSON.stringify(characterUpdates),
            headers: { 'Content-Type': 'application/json' },
          },
        )
        if (response.success && response.data) {
          const index = this.characters.findIndex((c) => c.id === id)
          if (index !== -1) {
            this.characters[index] = response.data
          }
          console.log(`Character with ID ${id} updated successfully.`)
          this.syncToLocalStorage()
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, `updating character with ID ${id}`)
      } finally {
        this.loading = false
      }
    },

    async deleteCharacter(id: number) {
      try {
        this.loading = true
        const response = await performFetch(`/api/characters/${id}`, {
          method: 'DELETE',
        })
        if (response.success) {
          this.characters = this.characters.filter((c) => c.id !== id)
          console.log(`Character with ID ${id} deleted successfully.`)
          this.syncToLocalStorage()
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, `deleting character with ID ${id}`)
      } finally {
        this.loading = false
      }
    },

    async generateCharacterImage(id: number, artPrompt: string) {
      try {
        this.loading = true
        const response = await performFetch<{ data: Character }>(
          `/api/characters/${id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ artPrompt }),
            headers: { 'Content-Type': 'application/json' },
          },
        )
        if (response.success && response.data) {
          const index = this.characters.findIndex((c) => c.id === id)
          if (index !== -1) {
            this.characters[index] = response.data
          }
          console.log(
            `Character image for ID ${id} updated successfully with prompt: "${artPrompt}"`,
          )
          this.syncToLocalStorage()
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, `generating character image for ID ${id}`)
      } finally {
        this.loading = false
      }
    },
  },
})
