import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import type { Character } from '@prisma/client'
import { performFetch, handleError } from '@/stores/utils'
import { useArtStore } from '@/stores/artStore'
import { useGalleryStore } from '@/stores/galleryStore'
import { useRandomCharacterData } from './utils/createRandomCharacter'

type RandomizerKeys =
  | 'name'
  | 'honorific'
  | 'class'
  | 'genre'
  | 'species'
  | 'personality'
  | 'backstory'
  | 'inventory'
  | 'quirks'
  | 'skills'
  | 'statName1'
  | 'statName2'
  | 'statName3'
  | 'statName4'
  | 'statName5'
  | 'statName6'
  | 'statValue1'
  | 'statValue2'
  | 'statValue3'
  | 'statValue4'
  | 'statValue5'
  | 'statValue6'

type RandomizerReturnType = {
  name: string
  honorific: string
  class: string
  genre: string
  species: string
  personality: string
  backstory: string
  inventory: string
  quirks: string
  skills: string
  statName1: string
  statName2: string
  statName3: string
  statName4: string
  statName5: string
  statName6: string
  statValue1: number
  statValue2: number
  statValue3: number
  statValue4: number
  statValue5: number
  statValue6: number
}

interface CharacterStoreState {
  characters: Character[]
  selectedCharacter: Character | null
  characterForm: Partial<Character>
  generatedCharacter: Partial<Character> | null
  artImagePath: string
  useGenerated: Record<string, boolean>
  keepField: Record<string, boolean>
  isSaving: boolean
  isGeneratingArt: boolean
  isInitialized: boolean
  loading: boolean
  generationMode: boolean
}

export const useCharacterStore = defineStore('characterStore', {
  state: (): CharacterStoreState => ({
    characters: [],
    selectedCharacter: null,
    characterForm: {},
    generatedCharacter: null,
    artImagePath: '',
    useGenerated: {},
    keepField: {},
    isSaving: false,
    isGeneratingArt: false,
    isInitialized: false,
    loading: false,
    generationMode: false,
  }),

  getters: {
    totalCharacters: (state) => state.characters.length,
    hasUnsavedChanges: (state) =>
      JSON.stringify(state.selectedCharacter) !==
      JSON.stringify(state.characterForm),
  },

  actions: {
    randomizerMap: {
      name: () => useRandomCharacterData().randomName(),
      honorific: () => useRandomCharacterData().randomHonorific(),
      class: () => useRandomCharacterData().randomClass(),
      genre: () => useRandomCharacterData().randomGenre(),
      species: () => useRandomCharacterData().randomSpecies(),
      personality: () => useRandomCharacterData().randomPersonality(),
      backstory: () => useRandomCharacterData().randomBackstory(),
      inventory: () => useRandomCharacterData().randomInventory(),
      quirks: () => useRandomCharacterData().randomQuirk(),
      skills: () => useRandomCharacterData().randomSkill(),
      statName1: () => 'Luck',
      statName2: () => 'Swol',
      statName3: () => 'Wits',
      statName4: () => 'Flexibility',
      statName5: () => 'Rizz',
      statName6: () => 'Empathy',
      statValue1: () => Math.floor(Math.random() * 100),
      statValue2: () => Math.floor(Math.random() * 100),
      statValue3: () => Math.floor(Math.random() * 100),
      statValue4: () => Math.floor(Math.random() * 100),
      statValue5: () => Math.floor(Math.random() * 100),
      statValue6: () => Math.floor(Math.random() * 100),
    },
    async initialize() {
      if (this.isInitialized) return
      this.loading = true
      try {
        const savedState = localStorage.getItem('characters')
        const savedForm = localStorage.getItem('characterForm')
        const savedGenerated = localStorage.getItem('useGenerated')

        // Restore characters from local storage
        if (savedState) {
          this.characters = JSON.parse(savedState) as Character[]
        }

        // Restore character form from local storage
        if (savedForm) {
          this.characterForm = JSON.parse(savedForm)
        } else {
          // Generate default randomized character if no saved form exists
          Object.assign(
            this.characterForm,
            useRandomCharacterData().generateRandomCharacter(),
          )
        }

        // Restore "useGenerated" state
        if (savedGenerated) {
          this.useGenerated = JSON.parse(savedGenerated)
        }

        // Fetch characters from API (ensures state is updated with server data)
        await this.fetchCharacters()

        this.isInitialized = true
      } catch (error) {
        handleError(error, 'initializing character store')
      } finally {
        this.loading = false
      }
    },
    getRandomValue(
      key: RandomizerKeys,
    ): RandomizerReturnType[RandomizerKeys] | null {
      const randomizers = useRandomCharacterData()

      const randomizerMap: Record<RandomizerKeys, () => string | number> = {
        name: randomizers.randomName,
        honorific: randomizers.randomHonorific,
        class: randomizers.randomClass,
        genre: randomizers.randomGenre,
        species: randomizers.randomSpecies,
        personality: randomizers.randomPersonality,
        backstory: randomizers.randomBackstory,
        inventory: randomizers.randomInventory,
        quirks: randomizers.randomQuirk,
        skills: randomizers.randomSkill,
        statName1: () => 'Luck',
        statName2: () => 'Swol',
        statName3: () => 'Wits',
        statName4: () => 'Flexibility',
        statName5: () => 'Rizz',
        statName6: () => 'Empathy',
        statValue1: () => Math.floor(Math.random() * 100),
        statValue2: () => Math.floor(Math.random() * 100),
        statValue3: () => Math.floor(Math.random() * 100),
        statValue4: () => Math.floor(Math.random() * 100),
        statValue5: () => Math.floor(Math.random() * 100),
        statValue6: () => Math.floor(Math.random() * 100),
      }

      if (randomizerMap[key]) {
        const randomValue = randomizerMap[key]()
        console.log(`Randomized value for "${key}":`, randomValue)
        return randomValue
      } else {
        console.warn(`No randomizer found for key: "${key}"`)
        return null
      }
    },

    updateFieldWithRandomValue<K extends RandomizerKeys>(field: K) {
      if (!this.randomizerMap[field]) {
        console.warn(`Randomizer for "${field}" is not defined.`)
        return
      }

      const randomValue = this.randomizerMap[field]()
      this.characterForm[field] = randomValue as Character[K]
    },

    async generateRandomCharacter() {
      try {
        // Generate random fields using a utility function
        const randomCharacterData =
          useRandomCharacterData().generateRandomCharacter()

        // Fetch a random image from the selected gallery via artStore
        const galleryStore = useGalleryStore()
        const randomGalleryImage = await galleryStore.changeToRandomImage()

        // Generate random stats
        const randomStats = this.rerollStats()

        // Combine all data into the character form
        this.characterForm = {
          ...randomCharacterData,
          ...randomStats,
          imagePath: randomGalleryImage || '/images/bot.webp', // Fallback to a default image
          isPublic: true,
        }

        this.generatedCharacter = { ...this.characterForm } // Save to generatedCharacter for reference
      } catch (error) {
        handleError(error, 'generating random character')
      }
    },
    async fetchCharacterRewards(characterId: number) {
      try {
        const response = await performFetch(
          `/api/rewards/character/${characterId}`,
        )
        if (response.success && response.data) {
          return response.data // Return the fetched rewards
        } else {
          throw new Error(
            response.message || 'Failed to fetch character rewards.',
          )
        }
      } catch (error) {
        handleError(error, 'fetching character rewards')
        return [] // Return an empty array in case of failure
      }
    },

    syncToLocalStorage() {
      try {
        localStorage.setItem('characters', JSON.stringify(this.characters))
        localStorage.setItem(
          'characterForm',
          JSON.stringify(this.characterForm),
        )
        localStorage.setItem('useGenerated', JSON.stringify(this.useGenerated))
      } catch (error) {
        console.error('Error syncing to localStorage:', error)
      }
    },

    async fetchCharacters() {
      this.loading = true
      try {
        const response = await performFetch<Character[]>('/api/characters')
        if (response.success && response.data) {
          this.characters = response.data
          this.syncToLocalStorage()
        } else {
          throw new Error(response.message || 'Failed to fetch characters')
        }
      } catch (error) {
        handleError(error, 'fetching characters')
      } finally {
        this.loading = false
      }
    },

    async selectCharacter(characterId: number) {
      const character = this.characters.find((c) => c.id === characterId)
      if (!character) {
        console.warn(`Character with ID ${characterId} not found.`)
        return
      }
      this.selectedCharacter = character
      this.characterForm = { ...character }
      await this.updateArtImagePath()
    },

    deselectCharacter() {
      this.selectedCharacter = null
      this.characterForm = {}
      this.artImagePath = '' // Reset art image path
    },

    async updateArtImagePath() {
      const artStore = useArtStore()
      if (this.selectedCharacter?.artImageId) {
        try {
          const image = await artStore.getArtImageById(
            this.selectedCharacter.artImageId,
          )
          this.artImagePath = image
            ? `data:image/${image.fileType};base64,${image.imageData}`
            : '/images/character-placeholder.webp'
        } catch (error) {
          console.error('Error fetching art image:', error)
          this.artImagePath = '/images/character-placeholder.webp' // Fallback on error
        }
      } else {
        this.artImagePath = '/images/character-placeholder.webp' // Default placeholder
      }
    },

    async saveCharacter() {
      this.isSaving = true
      try {
        const characterToSave = { ...this.characterForm }

        if (characterToSave.id) {
          await this.updateCharacter(characterToSave.id, characterToSave)
        } else {
          await this.createCharacter(characterToSave)
        }

        this.syncToLocalStorage()
        alert('Character saved successfully!')
      } catch (error) {
        handleError(error, 'saving character')
      } finally {
        this.isSaving = false
      }
    },
    updateField<K extends keyof Character>(field: K, value: Character[K]) {
      if (this.selectedCharacter) {
        this.selectedCharacter[field] = value
      } else {
        this.characterForm[field] = value
      }
    },
    async patchCharacter(id: number, updates: Partial<Character>) {
      try {
        const response = await performFetch<Character>(
          `/api/characters/${id}`,
          {
            method: 'PATCH',
            body: JSON.stringify(updates),
            headers: { 'Content-Type': 'application/json' },
          },
        )

        if (response.success && response.data) {
          const index = this.characters.findIndex((c) => c.id === id)
          if (index !== -1) {
            this.characters[index] = response.data
            if (this.selectedCharacter?.id === id) {
              this.selectedCharacter = response.data
            }
          }
        } else {
          throw new Error(response.message || 'Failed to update character.')
        }
      } catch (error) {
        handleError(error, 'patching character')
      }
    },
    async deleteCharacter(id: number) {
      try {
        const response = await performFetch(`/api/characters/${id}`, {
          method: 'DELETE',
        })

        if (response.success) {
          this.characters = this.characters.filter((c) => c.id !== id)
          if (this.selectedCharacter?.id === id) {
            this.selectedCharacter = null
          }
        } else {
          throw new Error(response.message || 'Failed to delete character.')
        }
      } catch (error) {
        handleError(error, 'deleting character')
      }
    },

    async createCharacter(character: Partial<Character> = {}) {
      try {
        const response = await performFetch<Character>('/api/characters', {
          method: 'POST',
          body: JSON.stringify(character),
          headers: { 'Content-Type': 'application/json' },
        })

        if (response.success && response.data) {
          this.characters.push(response.data)
          this.selectedCharacter = response.data // Select the newly created character
        } else {
          throw new Error(response.message || 'Failed to create character.')
        }
      } catch (error) {
        handleError(error, 'creating character')
      }
    },

    async updateCharacter(id: number, updates: Partial<Character>) {
      try {
        const response = await performFetch<Character>(
          `/api/characters/${id}`,
          {
            method: 'PATCH',
            body: JSON.stringify(updates),
            headers: { 'Content-Type': 'application/json' },
          },
        )

        if (response.success && response.data) {
          const index = this.characters.findIndex((c) => c.id === id)
          if (index !== -1) {
            this.characters[index] = response.data
            this.selectedCharacter = response.data
            await this.updateArtImagePath()
          }
          this.syncToLocalStorage()
        } else {
          throw new Error(response.message || 'Failed to update character')
        }
      } catch (error) {
        handleError(error, 'updating character')
      }
    },

    async generateCharacter() {
      try {
        const response = await performFetch<Partial<Character>>(
          '/api/characters/generate',
          { method: 'POST', body: JSON.stringify(this.characterForm) },
        )
        if (response.success && response.data) {
          this.generatedCharacter = response.data // Populate the generatedCharacter object
        } else {
          throw new Error(response.message || 'Failed to generate character')
        }
      } catch (error) {
        handleError(error, 'generating character')
      }
    },

    async generateFields(fieldsToUpgrade: string[]) {
      try {
        const response = await performFetch<Partial<Character>>(
          '/api/character/generate',
          {
            method: 'POST',
            body: JSON.stringify({
              character: this.characterForm,
              fieldsToUpgrade,
            }),
            headers: { 'Content-Type': 'application/json' },
          },
        )

        if (response.success && response.data) {
          Object.assign(this.characterForm, response.data)
        } else {
          throw new Error(response.message || 'Failed to generate fields.')
        }
      } catch (error) {
        handleError(error, 'generating fields')
      }
    },

    async generateArtImage() {
      this.isGeneratingArt = true
      try {
        if (!this.characterForm.artPrompt) {
          throw new Error('Art prompt is required.')
        }

        const artStore = useArtStore()
        const response = await artStore.generateArt({
          collection: 'characters',
          isPublic: this.characterForm.isPublic || true,
          designer: 'Kind Designer',
          title: `${this.characterForm.name} the ${this.characterForm.honorific}`,
          promptString: this.characterForm.artPrompt,
        })

        if (response.success && response.data) {
          this.characterForm.artImageId = response.data.artImageId
          await this.updateArtImagePath()
        } else {
          throw new Error(response.message || 'Failed to generate art.')
        }
      } catch (error) {
        handleError(error, 'generating art')
      } finally {
        this.isGeneratingArt = false
      }
    },

    setArtImageId(id: number) {
      if (this.characterForm) {
        this.characterForm.artImageId = id
        this.updateArtImagePath()
      }
    },

    async rerollStats() {
      const rollDice = () =>
        Array.from({ length: 10 }, () =>
          Math.floor(Math.random() * 10 + 1),
        ).reduce((a, b) => a + b)

      if (this.characterForm) {
        this.characterForm.statValue1 = rollDice()
        this.characterForm.statValue2 = rollDice()
        this.characterForm.statValue3 = rollDice()
        this.characterForm.statValue4 = rollDice()
        this.characterForm.statValue5 = rollDice()
        this.characterForm.statValue6 = rollDice()
      }
    },
  },
})

export type { Character }
