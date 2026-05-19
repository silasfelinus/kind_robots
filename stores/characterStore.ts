// /stores/characterStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Character } from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from '@/stores/utils'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'
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

type CharacterSaveResult = {
  success: boolean
  message: string
  data?: Character | null
}

const charactersStorageKey = 'characters'
const characterFormStorageKey = 'characterForm'
const useGeneratedStorageKey = 'useGenerated'
const selectedCharacterStorageKey = 'selectedCharacter'
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

function safeRemoveLocalStorage(key: string): void {
  if (!isClient) return

  try {
    localStorage.removeItem(key)
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

function normalizeCharacterId(
  input: number | string | Character | null | undefined,
) {
  if (typeof input === 'number') return Number.isInteger(input) ? input : 0

  if (typeof input === 'string') {
    const id = Number(input)
    return Number.isInteger(id) ? id : 0
  }

  if (input && typeof input === 'object' && 'id' in input) {
    const id = Number(input.id)
    return Number.isInteger(id) ? id : 0
  }

  return 0
}

export const useCharacterStore = defineStore('characterStore', () => {
  const characters = ref<Character[]>([])
  const selectedCharacter = ref<Character | null>(null)
  const characterForm = ref<Partial<Character>>({})
  const generatedCharacter = ref<Partial<Character> | null>(null)

  const artImagePath = ref(characterPlaceholder)
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

  const error = computed(() => lastError.value)
  const selectedCharacterId = computed(() => selectedCharacter.value?.id ?? 0)

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

  function createDefaultCharacterForm(
    overrides: Partial<Character> = {},
  ): Partial<Character> {
    const userStore = useUserStore()

    return {
      ...generateDefaultCharacter(),
      userId: userStore.userId || userStore.user?.id || 10,
      isPublic: true,
      imagePath: characterPlaceholder,
      ...overrides,
    }
  }

  function toCharacterForm(character: Character): Partial<Character> {
    return {
      ...character,
    }
  }

  function setCharacterForm(updates: Partial<Character>): void {
    characterForm.value = {
      ...characterForm.value,
      ...updates,
    }

    syncToLocalStorage()
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

    if (selectedCharacter.value) {
      safeSetLocalStorage(
        selectedCharacterStorageKey,
        JSON.stringify(selectedCharacter.value),
      )
    } else {
      safeRemoveLocalStorage(selectedCharacterStorageKey)
    }
  }

  function loadFromLocalStorage() {
    characters.value = safeParseCharacterArray(
      safeGetLocalStorage(charactersStorageKey),
    ).sort(sortCharacters)

    selectedCharacter.value = safeParseObject<Character | null>(
      safeGetLocalStorage(selectedCharacterStorageKey),
      null,
    )

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
    const shouldFetchRemote =
      Boolean(options.fetchRemote) &&
      (Boolean(options.force) ||
        !hasLoaded.value ||
        characters.value.length === 0)

    if (isInitialized.value && !options.force && !shouldFetchRemote) return

    if (initializePromise.value && !options.force) {
      return initializePromise.value
    }

    initializePromise.value = (async () => {
      try {
        isInitializing.value = true
        clearError()

        if (!isInitialized.value || options.force) {
          loadFromLocalStorage()
        }

        if (shouldFetchRemote) {
          await fetchCharacters(Boolean(options.force))
        }

        if (
          options.createDefaultForm !== false &&
          (!characterForm.value ||
            Object.keys(characterForm.value).length === 0)
        ) {
          characterForm.value = createDefaultCharacterForm()
          syncToLocalStorage()
        }

        if (
          selectedCharacter.value?.artImageId ||
          characterForm.value.artImageId
        ) {
          await updateArtImagePath()
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
    if (!force && hasLoaded.value) {
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

  async function fetchCharacterById(id: number, force = false) {
    const characterId = normalizeCharacterId(id)

    if (!characterId) return null

    if (!force) {
      const existing = characters.value.find(
        (character) => character.id === characterId,
      )

      if (existing) return existing
    }

    try {
      clearError()

      const response = await performFetch<Character>(
        `/api/characters/${characterId}`,
      )

      if (response.success && response.data) {
        upsertCharacter(response.data)
        return response.data
      }

      throw new Error(response.message || 'Failed to fetch character')
    } catch (error) {
      handleError(error, 'fetching character')
      setLastError(error, 'Failed to fetch character')
      return null
    }
  }

  async function selectCharacter(input: number | string | Character) {
    const characterId = normalizeCharacterId(input)

    if (!characterId) return null

    const found =
      characters.value.find((character) => character.id === characterId) ??
      (await fetchCharacterById(characterId))

    if (!found) return null

    selectedCharacter.value = found
    characterForm.value = toCharacterForm(found)
    syncToLocalStorage()
    await updateArtImagePath()

    return found
  }

  function deselectCharacter() {
    selectedCharacter.value = null
    characterForm.value = {}
    artImagePath.value = characterPlaceholder
    syncToLocalStorage()
  }

  function startAddingCharacter(overrides: Partial<Character> = {}) {
    selectedCharacter.value = null
    generatedCharacter.value = null
    characterForm.value = createDefaultCharacterForm(overrides)
    artImagePath.value =
      typeof characterForm.value.imagePath === 'string'
        ? characterForm.value.imagePath
        : characterPlaceholder
    syncToLocalStorage()
  }

  async function startEditingCharacter(input?: number | string | Character) {
    const characterId = normalizeCharacterId(input ?? selectedCharacter.value)

    if (!characterId) {
      startAddingCharacter()
      return null
    }

    const character =
      characters.value.find((entry) => entry.id === characterId) ??
      (await fetchCharacterById(characterId))

    if (!character) {
      setLastError(
        new Error(`Character ${characterId} was not found.`),
        'Character was not found',
      )
      return null
    }

    selectedCharacter.value = character
    characterForm.value = toCharacterForm(character)
    syncToLocalStorage()
    await updateArtImagePath()

    return character
  }

  async function startCloningCharacter(
    input: number | string | Character,
    overrides: Partial<Character> = {},
  ) {
    const characterId = normalizeCharacterId(input)

    if (!characterId) return null

    const source =
      characters.value.find((entry) => entry.id === characterId) ??
      (await fetchCharacterById(characterId))

    if (!source) {
      setLastError(
        new Error(`Character ${characterId} was not found.`),
        'Character was not found',
      )
      return null
    }

    selectedCharacter.value = null

    characterForm.value = {
      ...toCharacterForm(source),
      ...overrides,
      id: undefined,
      name: `Copy of ${source.name || 'Unnamed Character'}`,
      userId: overrides.userId ?? useUserStore().userId ?? 10,
      isPublic: overrides.isPublic ?? false,
    }

    artImagePath.value =
      typeof characterForm.value.imagePath === 'string'
        ? characterForm.value.imagePath
        : characterPlaceholder

    syncToLocalStorage()

    return source
  }

  async function updateArtImagePath() {
    const artStore = useArtStore()

    const artImageId =
      selectedCharacter.value?.artImageId ?? characterForm.value.artImageId

    if (!artImageId) {
      artImagePath.value =
        selectedCharacter.value?.imagePath ||
        characterForm.value.imagePath ||
        characterPlaceholder
      return
    }

    try {
      const image = await artStore.getArtImageById(artImageId)

      if (image?.imageData) {
        artImagePath.value = `data:image/${image.fileType || 'png'};base64,${
          image.imageData
        }`
      } else if (image?.imagePath || image?.path) {
        artImagePath.value =
          image.imagePath || image.path || characterPlaceholder
      } else {
        artImagePath.value = characterPlaceholder
      }
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

  async function saveCharacter(): Promise<CharacterSaveResult> {
    isSaving.value = true

    try {
      clearError()

      const char = { ...characterForm.value }

      const saved = char.id
        ? await updateCharacter(char.id, char)
        : await createCharacter(char)

      if (!saved) {
        throw new Error(lastError.value || 'Failed to save character')
      }

      syncToLocalStorage()

      return {
        success: true,
        message: char.id ? 'Character updated.' : 'Character created.',
        data: saved,
      }
    } catch (error) {
      handleError(error, 'saving character')
      setLastError(error, 'Failed to save character')

      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to save character',
        data: null,
      }
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
        characterForm.value = toCharacterForm(response.data)
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
        characterForm.value = toCharacterForm(response.data)
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
          characterForm.value = createDefaultCharacterForm()
          artImagePath.value = characterPlaceholder
        }

        syncToLocalStorage()

        return {
          success: true,
          message: 'Character deleted.',
        }
      }

      throw new Error(response.message || 'Failed to delete character')
    } catch (error) {
      handleError(error, 'deleting character')
      setLastError(error, 'Failed to delete character')

      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to delete character',
      }
    }
  }

  async function generateRandomCharacter() {
    try {
      clearError()

      const artStore = useArtStore()

      await artStore.initialize({
        fetchRemote: true,
        hydrateImages: true,
      })

      const images = artStore.safeArtImages.length
        ? artStore.safeArtImages
        : artStore.artImages

      const randomImage = images.length
        ? images[Math.floor(Math.random() * images.length)]
        : null

      const randomStats = rerollStats()

      characterForm.value = {
        ...createDefaultCharacterForm(),
        ...randomStats,
        artImageId: randomImage?.id ?? null,
        imagePath:
          randomImage?.imagePath || randomImage?.path || '/images/bot.webp',
        isPublic: true,
      }

      generatedCharacter.value = { ...characterForm.value }

      artImagePath.value =
        typeof characterForm.value.imagePath === 'string'
          ? characterForm.value.imagePath
          : characterPlaceholder

      syncToLocalStorage()
    } catch (error) {
      handleError(error, 'generating random character')
      setLastError(error, 'Failed to generate random character')
    }
  }

  function setArtImageId(id: number) {
    characterForm.value.artImageId = id
    characterForm.value.imagePath = null
    syncToLocalStorage()
    void updateArtImagePath()
  }

  function updateField<K extends keyof Character>(
    field: K,
    value: Character[K],
  ) {
    if (selectedCharacter.value) {
      selectedCharacter.value[field] = value
    }

    characterForm.value[field] = value
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
        title: `${characterForm.value.name || 'Character'} the ${
          characterForm.value.honorific || 'Unremarkable'
        }`,
        promptString: characterForm.value.artPrompt,
      })

      if (response.success && response.data) {
        characterForm.value.artImageId = response.data.id
        characterForm.value.imagePath =
          response.data.imagePath || response.data.path || null
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
    hasLoaded.value = false
    lastError.value = null
  }

  return {
    characters,
    selectedCharacter,
    selectedCharacterId,
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
    error,
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
    fetchCharacterById,
    selectCharacter,
    deselectCharacter,

    startAddingCharacter,
    startEditingCharacter,
    startCloningCharacter,
    createDefaultCharacterForm,
    toCharacterForm,
    setCharacterForm,

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
