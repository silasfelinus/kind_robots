// /stores/characterStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Character } from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from '@/stores/utils'
import { useArtStore } from '@/stores/artStore'
import { useGalleryStore } from '@/stores/galleryStore'
import {
  randomizerMap,
  getRandomValue,
  rerollStats,
  type RandomizerKeys,
} from '@/stores/helpers/characterHelper'

const isClient = typeof window !== 'undefined'

type CharacterInitializeOptions = {
  force?: boolean
  fetchRemote?: boolean
  createDefaultForm?: boolean
}

const charactersStorageKey = 'characters'
const characterFormStorageKey = 'characterForm'
const useGeneratedStorageKey = 'useGenerated'
const characterPlaceholder = '/images/character-placeholder.webp'

function safeGetLocalStorage(key: string): string | null {
  if (!isClient) return null

  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLocalStorage(key: string, value: string): void {
  if (!isClient) return

  try {
    localStorage.setItem(key, value)
  } catch {}
}

function safeParseObject<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback

  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as T) : fallback
  } catch {
    return fallback
  }
}

function safeParseCharacterArray(raw: string | null): Character[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Character[]) : []
  } catch {
    return []
  }
}

function sortCharacters(a: Character, b: Character): number {
  const aName = a.name || ''
  const bName = b.name || ''
  return aName.localeCompare(bName)
}

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
  const loading = ref(false)
  const isInitialized = ref(false)
  const isInitializing = ref(false)
  const lastError = ref<string | null>(null)

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchPromise = ref<Promise<Character[]> | null>(null)
  const fetchCharacterRewardsPromises = ref<Record<number, Promise<unknown[]>>>(
    {},
  )
  const hasLoaded = ref(false)

  const generationMode = ref(false)

  function setLastError(error: unknown, fallback: string): void {
    lastError.value = error instanceof Error ? error.message : fallback
  }

  function clearError(): void {
    lastError.value = null
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

  function syncToLocalStorage() {
    safeSetLocalStorage(charactersStorageKey, JSON.stringify(characters.value))
    safeSetLocalStorage(
      characterFormStorageKey,
      JSON.stringify(characterForm.value),
    )
    safeSetLocalStorage(
      useGeneratedStorageKey,
      JSON.stringify(useGenerated.value),
    )
  }

  function loadFromLocalStorage() {
    characters.value = safeParseCharacterArray(
      safeGetLocalStorage(charactersStorageKey),
    ).sort(sortCharacters)

    characterForm.value = safeParseObject<Partial<Character>>(
      safeGetLocalStorage(characterFormStorageKey),
      {},
    )

    useGenerated.value = safeParseObject<Record<string, boolean>>(
      safeGetLocalStorage(useGeneratedStorageKey),
      {},
    )
  }

  async function initialize(
    options: CharacterInitializeOptions = {},
  ): Promise<void> {
    if (isInitialized.value && !options.force) return
    if (initializePromise.value && !options.force)
      return initializePromise.value

    initializePromise.value = (async () => {
      try {
        isInitializing.value = true
        clearError()

        loadFromLocalStorage()

        if (options.fetchRemote) {
          await fetchCharacters(Boolean(options.force))
        }

        if (
          options.createDefaultForm !== false &&
          (!characterForm.value ||
            Object.keys(characterForm.value).length === 0)
        ) {
          characterForm.value = generateDefaultCharacter()
          syncToLocalStorage()
        }

        isInitialized.value = true
      } catch (error) {
        handleError(error, 'initializing character store')
        setLastError(error, 'Failed to initialize character store')
        isInitialized.value = false
      } finally {
        isInitializing.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function fetchCharacters(force = false): Promise<Character[]> {
    if (!force && hasLoaded.value && characters.value.length) {
      return characters.value
    }

    if (fetchPromise.value && !force) {
      return fetchPromise.value
    }

    fetchPromise.value = (async () => {
      loading.value = true

      try {
        clearError()

        const response = await performFetch<Character[]>('/api/characters')

        if (response.success && response.data) {
          characters.value = response.data.slice().sort(sortCharacters)
          hasLoaded.value = true
          syncToLocalStorage()
          return characters.value
        }

        throw new Error(response.message || 'Failed to fetch characters')
      } catch (error) {
        handleError(error, 'fetching characters')
        setLastError(error, 'Failed to fetch characters')
        return characters.value
      } finally {
        loading.value = false
        fetchPromise.value = null
      }
    })()

    return fetchPromise.value
  }

  async function selectCharacter(id: number) {
    const found = characters.value.find((character) => character.id === id)
    if (!found) return

    selectedCharacter.value = found
    characterForm.value = { ...found }
    syncToLocalStorage()
    await updateArtImagePath()
  }

  function deselectCharacter() {
    selectedCharacter.value = null
    characterForm.value = {}
    artImagePath.value = ''
    syncToLocalStorage()
  }

  async function updateArtImagePath() {
    const artStore = useArtStore()

    const artImageId =
      selectedCharacter.value?.artImageId ?? characterForm.value.artImageId

    if (!artImageId) {
      artImagePath.value = characterPlaceholder
      return
    }

    try {
      const image = await artStore.getArtImageById(artImageId)

      artImagePath.value = image
        ? `data:image/${image.fileType};base64,${image.imageData}`
        : characterPlaceholder
    } catch (error) {
      handleError(error, 'updating character art image path')
      artImagePath.value = characterPlaceholder
    }
  }

  function upsertCharacter(character: Character) {
    const index = characters.value.findIndex(
      (entry) => entry.id === character.id,
    )

    if (index >= 0) {
      characters.value.splice(index, 1, character)
    } else {
      characters.value.push(character)
    }

    characters.value.sort(sortCharacters)
    syncToLocalStorage()
  }

  async function saveCharacter() {
    isSaving.value = true

    try {
      clearError()

      const char = { ...characterForm.value }

      if (char.id) {
        await updateCharacter(char.id, char)
      } else {
        await createCharacter(char)
      }

      syncToLocalStorage()
    } catch (error) {
      handleError(error, 'saving character')
      setLastError(error, 'Failed to save character')
    } finally {
      isSaving.value = false
    }
  }

  async function createCharacter(character: Partial<Character>) {
    try {
      clearError()

      const response = await performFetch<Character>('/api/characters', {
        method: 'POST',
        body: JSON.stringify(character),
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.success && response.data) {
        upsertCharacter(response.data)
        selectedCharacter.value = response.data
        characterForm.value = { ...response.data }
        await updateArtImagePath()
        return response.data
      }

      throw new Error(response.message || 'Failed to create character')
    } catch (error) {
      handleError(error, 'creating character')
      setLastError(error, 'Failed to create character')
      return null
    }
  }

  async function updateCharacter(id: number, updates: Partial<Character>) {
    try {
      clearError()

      const response = await performFetch<Character>(`/api/characters/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.success && response.data) {
        upsertCharacter(response.data)
        selectedCharacter.value = response.data
        characterForm.value = { ...response.data }
        await updateArtImagePath()
        return response.data
      }

      throw new Error(response.message || 'Failed to update character')
    } catch (error) {
      handleError(error, 'mutating character')
      setLastError(error, 'Failed to update character')
      return null
    }
  }

  async function deleteCharacter(id: number) {
    try {
      clearError()

      const response = await performFetch(`/api/characters/${id}`, {
        method: 'DELETE',
      })

      if (response.success) {
        characters.value = characters.value.filter(
          (character) => character.id !== id,
        )

        if (selectedCharacter.value?.id === id) {
          selectedCharacter.value = null
          characterForm.value = generateDefaultCharacter()
          artImagePath.value = ''
        }

        syncToLocalStorage()
        return true
      }

      throw new Error(response.message || 'Failed to delete character')
    } catch (error) {
      handleError(error, 'deleting character')
      setLastError(error, 'Failed to delete character')
      return false
    }
  }

  async function generateRandomCharacter() {
    try {
      clearError()

      const galleryStore = useGalleryStore()

      if (!galleryStore.initialized) {
        await galleryStore.initialize()
      }

      const randomGalleryImage = await galleryStore.changeToRandomImage()
      const randomStats = rerollStats()

      characterForm.value = {
        ...generateDefaultCharacter(),
        ...randomStats,
        imagePath: randomGalleryImage || '/images/bot.webp',
        isPublic: true,
      }

      generatedCharacter.value = { ...characterForm.value }
      syncToLocalStorage()
    } catch (error) {
      handleError(error, 'generating random character')
      setLastError(error, 'Failed to generate random character')
    }
  }

  function setArtImageId(id: number) {
    characterForm.value.artImageId = id
    syncToLocalStorage()
    void updateArtImagePath()
  }

  function updateField<K extends keyof Character>(
    field: K,
    value: Character[K],
  ) {
    if (selectedCharacter.value) {
      selectedCharacter.value[field] = value
      characterForm.value[field] = value
    } else {
      characterForm.value[field] = value
    }

    syncToLocalStorage()
  }

  function rerollCharacterStats() {
    Object.assign(characterForm.value, rerollStats())
    syncToLocalStorage()
  }

  async function fetchCharacterRewards(
    characterId: number,
  ): Promise<unknown[]> {
    if (fetchCharacterRewardsPromises.value[characterId]) {
      return fetchCharacterRewardsPromises.value[characterId]
    }

    fetchCharacterRewardsPromises.value[characterId] = (async () => {
      try {
        const response = await performFetch<unknown[]>(
          `/api/rewards/character/${characterId}`,
        )

        return response.success && response.data ? response.data : []
      } catch (error) {
        handleError(error, 'fetching character rewards')
        return []
      } finally {
        delete fetchCharacterRewardsPromises.value[characterId]
      }
    })()

    return fetchCharacterRewardsPromises.value[characterId]
  }

  async function generateFields(fieldsToUpgrade: string[]) {
    try {
      clearError()

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
        syncToLocalStorage()
      }
    } catch (error) {
      handleError(error, 'generating fields')
      setLastError(error, 'Failed to generate character fields')
    }
  }

  async function generateArtImage() {
    isGeneratingArt.value = true

    try {
      clearError()

      if (!characterForm.value.artPrompt) {
        throw new Error('Art prompt is required.')
      }

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
        syncToLocalStorage()
      }
    } catch (error) {
      handleError(error, 'generating art')
      setLastError(error, 'Failed to generate character art')
    } finally {
      isGeneratingArt.value = false
    }
  }

  function resetInitialization() {
    isInitialized.value = false
    isInitializing.value = false
    initializePromise.value = null
    fetchPromise.value = null
    fetchCharacterRewardsPromises.value = {}
    lastError.value = null
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
    isInitializing,
    loading,
    lastError,
    generationMode,
    initializePromise,
    fetchPromise,
    fetchCharacterRewardsPromises,
    hasLoaded,

    initialize,
    resetInitialization,
    syncToLocalStorage,
    loadFromLocalStorage,
    fetchCharacters,
    selectCharacter,
    deselectCharacter,
    updateArtImagePath,
    saveCharacter,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    generateRandomCharacter,
    setArtImageId,
    updateField,
    rerollCharacterStats,
    fetchCharacterRewards,
    generateFields,
    generateArtImage,
    generateDefaultCharacter,
  }
})

export type { Character }
