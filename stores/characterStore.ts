import { defineStore } from 'pinia'
import type { Character } from '@prisma/client'
import { performFetch, handleError } from './../stores/utils'

export const useCharacterStore = defineStore({
  id: 'characterStore',

  state: () => ({
    characters: [] as Character[],
    newCharacter: {
      name: 'Spaghetti-Man',
      alignment: 'Chaotic Neutral',
      class: 'Cryptid Accountant',
      level: 1,
      experience: 0,
      artPrompt: '',
      artImageId: null,
      species: 'Ethereal Cryptid',
      backstory:
        'Once a myth whispered in laundromats, Spaghetti-Man emerged to ensure socks never form pairs in the universe.',
      drive: 'Stealing socks to balance cosmic accounts',
      inventory:
        'Single socks of all colors and textures, a balance sheet from beyond',
      quirks: 'Steals socks|Only eats spaghetti|Talks in riddles',
      skills: 'Sock Snatching|Ghostly Calculations|Cosmic Disruptions',
      genre: 'Fantasy/Comedy',
      statName1: 'Luck',
      statValue1: 12,
      statName2: 'Swol',
      statValue2: 9,
      statName3: 'Wits',
      statValue3: 15,
      statName4: 'Durability',
      statValue4: 8,
      statName5: 'Rizz',
      statValue5: 11,
      statName6: 'Skibidi',
      statValue6: 10,
      goalStat1Name: 'Principled|Chaotic',
      goalStat1Value: 5,
      goalStat2Name: 'Introvert|Extrovert',
      goalStat2Value: -3,
      goalStat3Name: 'Passive|Aggressive',
      goalStat3Value: 2,
      goalStat4Name: 'Optimist|Pessimist',
      goalStat4Value: -1,
    } as Character,
    selectedCharacter: null as Character | null, // Currently selected character
    characterForm: null as Partial<Character> | null, // Temporary character edits or drafts
    loading: false,
    isInitialized: false,
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
      if (this.isInitialized) {
        console.log('Character store is already initialized.')
        return
      }
      try {
        await this.fetchCharacters()
        console.log('Character store initialized successfully.')
        this.isInitialized = true
      } catch (error) {
        handleError(error, 'Error while initializing the character store')
      }
    },

    async fetchCharacters() {
      try {
        this.loading = true
        const response = await performFetch<Character[]>('/api/characters')

        if (response?.success && response.data) {
          this.characters = response.data // Correctly extract and assign `data`
          console.log('Fetched characters:', this.characters)
          this.syncToLocalStorage()
        } else {
          throw new Error(response?.message || 'Error fetching characters')
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
        const response = await performFetch<Character>(`/api/characters/${id}`)

        if (response?.success && response.data) {
          this.selectedCharacter = response.data // Correctly extract and assign `data`
          console.log(
            `Fetched character with ID ${id}:`,
            this.selectedCharacter,
          )
        } else {
          throw new Error(response?.message || 'Error fetching character by ID')
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
        const response = await performFetch<Character>('/api/characters', {
          method: 'POST',
          body: JSON.stringify(character),
          headers: { 'Content-Type': 'application/json' },
        })

        if (response?.success && response.data) {
          this.characters.push(response.data) // Correctly extract and assign `data`
          console.log('Character created successfully:', response.data)
          this.syncToLocalStorage()
        } else {
          throw new Error(response?.message || 'Error creating character')
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
        const response = await performFetch<Character>(
          `/api/characters/${id}`,
          {
            method: 'PATCH',
            body: JSON.stringify(characterUpdates),
            headers: { 'Content-Type': 'application/json' },
          },
        )

        if (response?.success && response.data) {
          const index = this.characters.findIndex((c) => c.id === id)
          if (index !== -1) {
            this.characters[index] = response.data // Correctly extract and assign `data`
          }
          console.log(`Character with ID ${id} updated successfully.`)
          this.syncToLocalStorage()
        } else {
          throw new Error(response?.message || 'Error updating character')
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
        const response = await performFetch<{
          success: boolean
          message?: string
        }>(`/api/characters/${id}`, {
          method: 'DELETE',
        })

        if (response?.success) {
          this.characters = this.characters.filter((c) => c.id !== id)
          console.log(`Character with ID ${id} deleted successfully.`)
          this.syncToLocalStorage()
        } else {
          throw new Error(response?.message || 'Error deleting character')
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
        const response = await performFetch<Character>(
          `/api/characters/${id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ artPrompt }),
            headers: { 'Content-Type': 'application/json' },
          },
        )

        if (response?.success && response.data) {
          const index = this.characters.findIndex((c) => c.id === id)
          if (index !== -1) {
            this.characters[index] = response.data // Correctly extract and assign `data`
          }
          console.log(
            `Character image for ID ${id} updated successfully with prompt: "${artPrompt}"`,
          )
          this.syncToLocalStorage()
        } else {
          throw new Error(
            response?.message || 'Error generating character image',
          )
        }
      } catch (error) {
        handleError(error, `generating character image for ID ${id}`)
      } finally {
        this.loading = false
      }
    },
  },
})

export type { Character }
