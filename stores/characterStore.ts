// /stores/characterStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Character } from '~/server/generated/prisma'
import { performFetch, handleError } from '@/stores/utils'
import { useArtStore } from '@/stores/artStore'
import { useGalleryStore } from '@/stores/galleryStore'
import {
  randomizerMap,
  getRandomValue,
  updateFieldWithRandomValue,
  rerollStats,
  type RandomizerKeys,
} from '@/stores/helpers/characterHelper'

export const useCharacterStore = defineStore('characterStore', () => {
  const characters = ref<Character[]>([])
  const selectedCharacter = ref<Character | null>(null)
  const characterForm = ref<Partial<Character>>({})
  const generatedCharacter = ref<Partial<Character> | null>(null)
  const artImagePath = ref('')
  const useGenerated = ref<Record<string, boolean>>({})
  const keepField = ref<Record<string, boolean>>({})
  const isSaving = ref(false)
  const isGeneratingArt = ref(false)
  const isInitialized = ref(false)
  const loading = ref(false)
  const generationMode = ref(false)

  async function initialize() {
    if (isInitialized.value) return
    loading.value = true
    try {
      const savedCharacters = localStorage.getItem('characters')
      const savedForm = localStorage.getItem('characterForm')
      const savedGenerated = localStorage.getItem('useGenerated')

      if (savedCharacters) characters.value = JSON.parse(savedCharacters)
      if (savedForm) characterForm.value = JSON.parse(savedForm)
      else characterForm.value = { ...generateDefaultCharacter() }
      if (savedGenerated) useGenerated.value = JSON.parse(savedGenerated)

      await fetchCharacters()
      isInitialized.value = true
    } catch (error) {
      handleError(error, 'initializing character store')
    } finally {
      loading.value = false
    }
  }

  function generateDefaultCharacter() {
    const base = Object.fromEntries(
      Object.keys(randomizerMap).map((key) => [
        key,
        getRandomValue(key as RandomizerKeys),
      ]),
    )
    return base as Partial<Character>
  }

  async function fetchCharacters() {
    loading.value = true
    try {
      const response = await performFetch<Character[]>('/api/characters')
      if (response.success && response.data) {
        characters.value = response.data
        syncToLocalStorage()
      } else {
        throw new Error(response.message || 'Failed to fetch characters')
      }
    } catch (error) {
      handleError(error, 'fetching characters')
    } finally {
      loading.value = false
    }
  }

  function syncToLocalStorage() {
    localStorage.setItem('characters', JSON.stringify(characters.value))
    localStorage.setItem('characterForm', JSON.stringify(characterForm.value))
    localStorage.setItem('useGenerated', JSON.stringify(useGenerated.value))
  }

  async function selectCharacter(id: number) {
    const found = characters.value.find((c: { id: number }) => c.id === id)
    if (!found) return
    selectedCharacter.value = found
    characterForm.value = { ...found }
    await updateArtImagePath()
  }

  function deselectCharacter() {
    selectedCharacter.value = null
    characterForm.value = {}
    artImagePath.value = ''
  }

  async function updateArtImagePath() {
    const artStore = useArtStore()
    if (selectedCharacter.value?.artImageId) {
      try {
        const image = await artStore.getArtImageById(
          selectedCharacter.value.artImageId,
        )
        artImagePath.value = image
          ? `data:image/${image.fileType};base64,${image.imageData}`
          : '/images/character-placeholder.webp'
      } catch (error) {
        artImagePath.value = '/images/character-placeholder.webp'
      }
    } else {
      artImagePath.value = '/images/character-placeholder.webp'
    }
  }

  async function saveCharacter() {
    isSaving.value = true
    try {
      const char = { ...characterForm.value }
      if (char.id) await updateCharacter(char.id, char)
      else await createCharacter(char)
      syncToLocalStorage()
    } catch (error) {
      handleError(error, 'saving character')
    } finally {
      isSaving.value = false
    }
  }

  async function createCharacter(character: Partial<Character>) {
    try {
      const response = await performFetch<Character>('/api/characters', {
        method: 'POST',
        body: JSON.stringify(character),
        headers: { 'Content-Type': 'application/json' },
      })
      if (response.success && response.data) {
        characters.value.push(response.data)
        selectedCharacter.value = response.data
      }
    } catch (error) {
      handleError(error, 'creating character')
    }
  }

  async function updateCharacter(id: number, updates: Partial<Character>) {
    try {
      const response = await performFetch<Character>(`/api/characters/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
        headers: { 'Content-Type': 'application/json' },
      })
      if (response.success && response.data) {
        const index = characters.value.findIndex(
          (c: { id: number }) => c.id === id,
        )
        if (index !== -1) characters.value[index] = response.data
        selectedCharacter.value = response.data
        await updateArtImagePath()
      }
    } catch (error) {
      handleError(error, 'updating character')
    }
  }

  async function patchCharacter(id: number, updates: Partial<Character>) {
    try {
      const response = await performFetch<Character>(`/api/characters/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
        headers: { 'Content-Type': 'application/json' },
      })
      if (response.success && response.data) {
        const index = characters.value.findIndex(
          (c: { id: number }) => c.id === id,
        )
        if (index !== -1) characters.value[index] = response.data
      }
    } catch (error) {
      handleError(error, 'patching character')
    }
  }

  async function deleteCharacter(id: number) {
    try {
      const response = await performFetch(`/api/characters/${id}`, {
        method: 'DELETE',
      })
      if (response.success) {
        characters.value = characters.value.filter(
          (c: { id: number }) => c.id !== id,
        )
        if (selectedCharacter.value?.id === id) selectedCharacter.value = null
      }
    } catch (error) {
      handleError(error, 'deleting character')
    }
  }

  async function generateRandomCharacter() {
    try {
      const randomData = generateDefaultCharacter()
      const galleryStore = useGalleryStore()
      const randomGalleryImage = await galleryStore.changeToRandomImage()
      const randomStats = rerollStats()

      characterForm.value = {
        ...randomData,
        ...randomStats,
        imagePath: randomGalleryImage || '/images/bot.webp',
        isPublic: true,
      }

      generatedCharacter.value = { ...characterForm.value }
    } catch (error) {
      handleError(error, 'generating random character')
    }
  }

  function setArtImageId(id: number) {
    characterForm.value.artImageId = id
    updateArtImagePath()
  }

  function updateField<K extends keyof Character>(
    field: K,
    value: Character[K],
  ) {
    if (selectedCharacter.value) {
      selectedCharacter.value[field] = value
    } else {
      characterForm.value[field] = value
    }
  }

  function rerollCharacterStats() {
    Object.assign(characterForm.value, rerollStats())
  }

  async function fetchCharacterRewards(characterId: number) {
    try {
      const response = await performFetch(
        `/api/rewards/character/${characterId}`,
      )
      return response.success && response.data ? response.data : []
    } catch (error) {
      handleError(error, 'fetching character rewards')
      return []
    }
  }

  async function generateFields(fieldsToUpgrade: string[]) {
    try {
      const response = await performFetch<Partial<Character>>(
        '/api/character/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            character: characterForm.value,
            fieldsToUpgrade,
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      )
      if (response.success && response.data) {
        Object.assign(characterForm.value, response.data)
      }
    } catch (error) {
      handleError(error, 'generating fields')
    }
  }

  async function generateArtImage() {
    isGeneratingArt.value = true
    try {
      if (!characterForm.value.artPrompt)
        throw new Error('Art prompt is required.')
      const artStore = useArtStore()
      const response = await artStore.generateArt({
        collection: 'characters',
        isPublic: characterForm.value.isPublic ?? true,
        designer: 'Kind Designer',
        title: `${characterForm.value.name} the ${characterForm.value.honorific}`,
        promptString: characterForm.value.artPrompt,
      })
      if (response.success && response.data) {
        characterForm.value.artImageId = response.data.artImageId
        await updateArtImagePath()
      }
    } catch (error) {
      handleError(error, 'generating art')
    } finally {
      isGeneratingArt.value = false
    }
  }

  return {
    characters,
    selectedCharacter,
    characterForm,
    generatedCharacter,
    artImagePath,
    useGenerated,
    keepField,
    isSaving,
    isGeneratingArt,
    isInitialized,
    loading,
    generationMode,
    initialize,
    fetchCharacters,
    syncToLocalStorage,
    selectCharacter,
    deselectCharacter,
    updateArtImagePath,
    saveCharacter,
    createCharacter,
    updateCharacter,
    patchCharacter,
    deleteCharacter,
    generateRandomCharacter,
    setArtImageId,
    updateField,
    rerollCharacterStats,
    fetchCharacterRewards,
    generateFields,
    generateArtImage,
  }
})

export type { Character }
