import { defineStore } from 'pinia'
import type { Character } from '@prisma/client'
import { performFetch, handleError } from './../stores/utils'

export const useCharacterStore = defineStore({
  id: 'characterStore',

  state: () => ({
    characters: [] as Character[],
    newCharacter: {} as Partial<Character>,
    selectedCharacter: null as Character | null,
    generatedCharacter: null as Partial<Character> | null,
    keepField: {} as Record<string, boolean>,
    useGenerated: {} as Record<string, boolean>,
    isSaving: false,
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
      if (this.isInitialized) {
        console.log('Character store is already initialized.')
        return
      }
      try {
        await this.fetchCharacters()
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
          this.characters = response.data
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
      this.selectedCharacter = this.characters.find((c) => c.id === id) || null
      if (!this.selectedCharacter) {
        console.warn(`Character with ID ${id} not found.`)
      }
    },
    async generateFields() {
      // Ensure selectedCharacter is not null
      const selectedCharacter = this.selectedCharacter
      if (!selectedCharacter) {
        console.warn('No character selected for field generation.')
        return
      }

      // Use type assertion or create a temporary variable
      const fieldsToUpgrade = Object.keys(selectedCharacter).filter(
        (key) =>
          !this.keepField[key] &&
          typeof selectedCharacter[key as keyof Character] === 'string',
      )

      try {
        await this.generateCharacterUpdate(selectedCharacter, fieldsToUpgrade)
        if (this.generatedCharacter) {
          Object.assign(this.newCharacter, this.generatedCharacter)
        }
      } catch (error) {
        handleError(error, 'generating fields')
      }
    },

    async generateCharacterUpdate(
      character: Partial<Character>,
      fieldsToUpgrade: string[],
      instructions?: string,
    ) {
      try {
        this.loading = true

        const requestBody = {
          character,
          fieldsToUpgrade,
          instructions,
        }

        const response = await performFetch<Partial<Character>>(
          '/api/character/generate',
          {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: { 'Content-Type': 'application/json' },
          },
        )

        if (response?.success && response.data) {
          this.generatedCharacter = response.data
        } else {
          throw new Error(
            response?.message || 'Error generating character update',
          )
        }
      } catch (error) {
        handleError(error, 'generating character update')
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
          this.characters.push(response.data)
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

    async patchCharacter(id: number, characterUpdates: Partial<Character>) {
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
            this.characters[index] = response.data
          }
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

    rerollStats() {
      if (!this.selectedCharacter) {
        console.warn('No character selected to reroll stats.')
        return
      }

      const rollDice = () =>
        Math.floor(Math.random() * 6 + 1) +
        Math.floor(Math.random() * 6 + 1) +
        Math.floor(Math.random() * 6 + 1)

      this.selectedCharacter.statValue1 = rollDice()
      this.selectedCharacter.statValue2 = rollDice()
      this.selectedCharacter.statValue3 = rollDice()
      this.selectedCharacter.statValue4 = rollDice()
      this.selectedCharacter.statValue5 = rollDice()
      this.selectedCharacter.statValue6 = rollDice()
    },
  },
})

export type { Character }
