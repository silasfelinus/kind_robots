import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import type { Character } from '@prisma/client'
import { performFetch, handleError } from '@/stores/utils'
import { useArtStore } from '@/stores/artStore'

export const useCharacterStore = defineStore({
  id: 'characterStore',

  state: () => ({
    characters: [] as Character[],
    selectedCharacter: null as Character | null,
    characterForm: {} as Partial<Character>,
    artImagePath: ref(''), // Path for the selected character's art image
    useGenerated: reactive<Record<string, boolean>>({}),
    keepField: reactive<Record<string, boolean>>({}),
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
    async initialize() {
      if (this.isInitialized) return
      this.loading = true
      try {
        const savedState = localStorage.getItem('characters')
        const savedForm = localStorage.getItem('characterForm')
        const savedGenerated = localStorage.getItem('useGenerated')

        if (savedState) {
          this.characters = JSON.parse(savedState) as Character[]
        }
        if (savedForm) {
          this.characterForm = JSON.parse(savedForm)
        }
        if (savedGenerated) {
          this.useGenerated = JSON.parse(savedGenerated)
        }

        await this.fetchCharacters()
        this.isInitialized = true
      } catch (error) {
        handleError(error, 'initializing character store')
      } finally {
        this.loading = false
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

    async createCharacter(character: Partial<Character>) {
      try {
        const response = await performFetch<Character>('/api/characters', {
          method: 'POST',
          body: JSON.stringify(character),
          headers: { 'Content-Type': 'application/json' },
        })

        if (response.success && response.data) {
          this.characters.push(response.data)
          this.syncToLocalStorage()
        } else {
          throw new Error(response.message || 'Failed to create character')
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

    toggleGenerated(field: string) {
      if (field in this.useGenerated) {
        this.useGenerated[field] = !this.useGenerated[field]
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
