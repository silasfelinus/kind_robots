import { defineStore } from 'pinia'
import type { Character } from '@prisma/client'
import { performFetch, handleError } from './../stores/utils'
import { useRewardStore } from './../stores/rewardStore'

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
  currentDisplayMode: 'normal' as 'normal' | 'edit' | 'generator', // Tracks the current mode
}),


  getters: {
    // Computed states
    
    getSelectedCharacter: (state) => state.selectedCharacter,
    getGeneratedCharacter: (state) => state.generatedCharacter,
  },

  actions: {
    setDisplayMode(mode: 'normal' | 'edit' | 'generator') {
    this.currentDisplayMode = mode
    this.generationMode = mode === 'generator'
    this.creatorMode = mode === 'edit' || mode === 'generator'
  },

  toggleGenerationMode() {
    this.setDisplayMode(this.generationMode ? 'edit' : 'generator')
  },

  exitToNormalMode() {
    this.setDisplayMode('normal')
    this.generatedCharacter = null
  },

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

    async generateCharacterUpdate(
  character: Partial<Character>,
  fieldsToUpgrade: string[],
  instructions?: string
) {
  try {
    this.loading = true

    const safeFields = Object.keys(this.keepField).filter(
      (field) => this.keepField[field]
    )

    const requestBody = {
      character,
      fieldsToUpgrade,
      safeFields,
      instructions,
    }

    const response = await performFetch<Partial<Character>>(
      '/api/character/generate',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      }
    )

    if (response?.success && response.data) {
      this.generatedCharacter = response.data
    } else {
      throw new Error(
        response?.message || 'Error generating character update'
      )
    }
  } catch (error) {
    handleError(error, 'generating character update')
  } finally {
    this.loading = false
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

    createNewCharacter() {
      const newCharacter: Partial<Character> = {
        name: 'New Character',
        honorific: 'Adventurer',
        experience: 0,
        level: 1,
        statName1: 'Luck',
        statValue1: 50,
        statName2: 'Swol',
        statValue2: 9,
        statName3: 'Wits',
        statValue3: 9,
        statName4: 'Fortitude',
        statValue4: 9,
        statName5: 'Rizz',
        statValue5: 9,
        statName6: 'Empathy',
        statValue6: 9,
        goalStat1Name: 'Principled|Chaotic',
        goalStat1Value: 0,
        goalStat2Name: 'Introvert|Extrovert',
        goalStat2Value: 0,
        goalStat3Name: 'Passive|Aggressive',
        goalStat3Value: 0,
        goalStat4Name: 'Optimist|Pessimist',
        goalStat4Value: 0,
        artImageId: null,
        isPublic: false,
        userId: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      this.selectedCharacter = newCharacter as Character
    },

    async createCharacter(character: Partial<Character>) {
      try {
        this.loading = true

        const rewardStore = useRewardStore() // Access the rewardStore
        const currentReward = rewardStore.currentReward

        // Add the reward relationship if currentReward exists
        const characterPayload = {
          ...character,
          Rewards: currentReward
            ? { connect: [{ id: currentReward.id }] }
            : undefined,
        }

        const response = await performFetch<Character>('/api/characters', {
          method: 'POST',
          body: JSON.stringify(characterPayload),
          headers: { 'Content-Type': 'application/json' },
        })

        if (response?.success && response.data) {
          this.characters.push(response.data)
          this.syncToLocalStorage()
          this.selectedCharacter = response.data // Select the newly created character
        } else {
          throw new Error(response?.message || 'Error creating character')
        }
      } catch (error) {
        handleError(error, 'creating character')
      } finally {
        this.loading = false
      }
    },

    async patchCharacter(
      id: number,
      characterUpdates: Partial<Character>,
      rewardIds?: number[],
    ) {
      try {
        this.loading = true

        const data = {
          ...characterUpdates,
          Rewards: rewardIds
            ? { set: rewardIds.map((id) => ({ id })) }
            : undefined,
        }

        const response = await performFetch<Character>(
          `/api/characters/${id}`,
          {
            method: 'PATCH',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
          },
        )

        if (response?.success && response.data) {
          const index = this.characters.findIndex((c) => c.id === id)
          if (index !== -1) {
            this.characters[index] = response.data
          }
          this.selectedCharacter = response.data // Update the selected character
        } else {
          throw new Error(response?.message || 'Error updating character')
        }
      } catch (error) {
        handleError(error, `updating character with ID ${id}`)
      } finally {
        this.loading = false
      }
    },
    updateField(field: keyof Character, value: string | number | null) {
      if (this.useGenerated[field]) {
        this.generatedCharacter = {
          ...this.generatedCharacter,
          [field]: value,
        }
      } else if (this.selectedCharacter) {
        this.selectedCharacter = {
          ...this.selectedCharacter,
          [field]: value,
        }
      }
    },
toggleSafeField(field: string) {
    this.keepField[field] = !this.keepField[field]
  },

  confirmGeneratedUpdates() {
    if (!this.generatedCharacter) return

    this.selectedCharacter = {
      ...this.selectedCharacter,
      ...Object.fromEntries(
        Object.entries(this.generatedCharacter).filter(
          ([key]) => this.useGenerated[key]
        )
      ),
    }

    this.exitToNormalMode() // Reset after confirmation
  },

    async deleteCharacter(id: number) {
      try {
        const response = await performFetch(`/api/characters/${id}`, {
          method: 'DELETE',
        })

        if (response?.success) {
          this.characters = this.characters.filter((c) => c.id !== id)
          if (this.selectedCharacter?.id === id) {
            this.selectedCharacter = null
          }
          this.syncToLocalStorage()
        } else {
          throw new Error(response?.message || 'Error deleting character')
        }
      } catch (error) {
        handleError(error, `deleting character with ID ${id}`)
      }
    },

    rerollStats() {
  if (!this.selectedCharacter) {
    console.warn('No character selected to reroll stats.')
    return
  }

  const rollDice = () => Array.from({ length: 10 }, () => Math.floor(Math.random() * 10 + 1)).reduce((a, b) => a + b)

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
