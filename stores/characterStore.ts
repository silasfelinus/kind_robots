// /stores/characterStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Character, Rarity } from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from '@/stores/utils'
import { resolveArtImageSrc } from '@/utils/artImageSrc'
import {
  loadSnapshot,
  markSnapshotActive,
} from '@/stores/helpers/snapshotLoader'
import { mergeDefinedRecord } from '@/stores/helpers/recordMerge'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'
import { useGeneratorStore } from '@/stores/generatorStore'
import { useAchievementStore } from '@/stores/achievementStore'

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

export type CharacterBrowse = Pick<
  Character,
  | 'id'
  | 'name'
  | 'alignment'
  | 'experience'
  | 'level'
  | 'class'
  | 'species'
  | 'genre'
  | 'artImageId'
  | 'cardArtImageId'
  | 'heroArtImageId'
  | 'iconArtImageId'
  | 'isPublic'
  | 'userId'
  | 'packId'
  | 'honorific'
  | 'imagePath'
  | 'icon'
  | 'iconPath'
  | 'cardPath'
  | 'heroPath'
  | 'allowReviews'
  | 'designer'
  | 'isMature'
  | 'isActive'
  | 'charm'
  | 'empathy'
  | 'grace'
  | 'luck'
  | 'might'
  | 'presentation'
  | 'role'
  | 'title'
  | 'wits'
  | 'gender'
  | 'slug'
  | 'theme'
>

const charactersStorageKey = 'characters'
const characterFormStorageKey = 'characterForm'
const useGeneratedStorageKey = 'useGenerated'
const selectedCharacterStorageKey = 'selectedCharacter'
const characterPlaceholder = '/images/character-placeholder.webp'

type CharacterStatKey =
  | 'luck'
  | 'might'
  | 'wits'
  | 'grace'
  | 'charm'
  | 'empathy'

const characterRandomFields = [
  'name',
  'honorific',
  'class',
  'genre',
  'species',
  'personality',
  'backstory',
  'quirks',
] as const

type CharacterRandomField = (typeof characterRandomFields)[number]

function randomRarity(): Rarity {
  const roll = Math.random()

  if (roll < 0.45) return 'COMMON'
  if (roll < 0.7) return 'UNCOMMON'
  if (roll < 0.87) return 'RARE'
  if (roll < 0.96) return 'EPIC'
  if (roll < 0.995) return 'LEGENDARY'

  return 'MYTHIC'
}

function rerollStats(): Record<CharacterStatKey, Rarity> {
  return {
    luck: randomRarity(),
    might: randomRarity(),
    wits: randomRarity(),
    grace: randomRarity(),
    charm: randomRarity(),
    empathy: randomRarity(),
  }
}

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

function safeParseCharacterBrowseArray(raw: string | null): CharacterBrowse[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? (parsed as Character[]).map(toCharacterBrowse)
      : []
  } catch {
    return []
  }
}

function sortCharacters<T extends Pick<Character, 'name'>>(a: T, b: T): number {
  const aName = a.name || ''
  const bName = b.name || ''

  return aName.localeCompare(bName)
}

function toCharacterBrowse(character: Character): CharacterBrowse {
  return {
    id: character.id,
    name: character.name,
    alignment: character.alignment,
    experience: character.experience,
    level: character.level,
    class: character.class,
    species: character.species,
    genre: character.genre,
    artImageId: character.artImageId,
    cardArtImageId: character.cardArtImageId,
    heroArtImageId: character.heroArtImageId,
    iconArtImageId: character.iconArtImageId,
    isPublic: character.isPublic,
    userId: character.userId,
    packId: character.packId,
    honorific: character.honorific,
    imagePath: character.imagePath,
    icon: character.icon,
    iconPath: character.iconPath,
    cardPath: character.cardPath,
    heroPath: character.heroPath,
    allowReviews: character.allowReviews,
    designer: character.designer,
    isMature: character.isMature,
    isActive: character.isActive,
    charm: character.charm,
    empathy: character.empathy,
    grace: character.grace,
    luck: character.luck,
    might: character.might,
    presentation: character.presentation,
    role: character.role,
    title: character.title,
    wits: character.wits,
    gender: character.gender,
    slug: character.slug,
    theme: character.theme,
  }
}

function normalizeCharacterId(
  input: number | string | Character | CharacterBrowse | null | undefined,
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
  // The complete lightweight catalog. Gallery/picker consumers should use this.
  const browseCharacters = ref<CharacterBrowse[]>([])
  // Rich by-id detail cache only. Interaction/edit/clone/Stage prompt consumers
  // use this cache through fetchCharacterById/selectCharacter.
  const characters = ref<Character[]>([])
  const usingSnapshot = ref(false)
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
  const fetchPromise = ref<Promise<CharacterBrowse[]> | null>(null)
  const fetchCharacterByIdPromises = new Map<
    number,
    Promise<Character | null>
  >()
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

  function generateDefaultCharacter(): Partial<Character> {
    const generator = useGeneratorStore()

    const base: Partial<Character> = {}

    for (const field of characterRandomFields) {
      base[field] = generator.generateOne(field)
    }

    return {
      ...base,
      ...rerollStats(),
    }
  }

  function createDefaultCharacterForm(
    overrides: Partial<Character> = {},
  ): Partial<Character> {
    const userStore = useUserStore()

    return {
      ...generateDefaultCharacter(),
      userId: userStore.authenticatedUserId,
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

  function toCharacterMutationPayload(
    character: Partial<Character>,
  ): Partial<Character> {
    const {
      id: _id,
      userId: _userId,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      User: _user,
      ...payload
    } = character as Partial<Character> & { User?: unknown }

    return payload
  }

  function setCharacterForm(updates: Partial<Character>): void {
    characterForm.value = {
      ...characterForm.value,
      ...updates,
    }

    syncToLocalStorage()
  }

  function syncToLocalStorage() {
    safeSetLocalStorage(
      charactersStorageKey,
      JSON.stringify(browseCharacters.value),
    )
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
    browseCharacters.value = safeParseCharacterBrowseArray(
      safeGetLocalStorage(charactersStorageKey),
    ).sort(sortCharacters)

    selectedCharacter.value = safeParseObject<Character | null>(
      safeGetLocalStorage(selectedCharacterStorageKey),
      null,
    )
    characters.value = selectedCharacter.value ? [selectedCharacter.value] : []

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
        browseCharacters.value.length === 0)

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

        // First visit (or cleared storage): paint a lightweight catalog from the
        // nightly snapshot so the page still has real characters if the database
        // is down. Rich detail stays out of the catalog and is fetched by id when
        // interaction/editing/Stage actually needs it.
        if (browseCharacters.value.length === 0) {
          const snapshotRows = await loadSnapshot<Character>('characters')

          if (snapshotRows.length && browseCharacters.value.length === 0) {
            browseCharacters.value = snapshotRows
              .map(toCharacterBrowse)
              .sort(sortCharacters)
            usingSnapshot.value = true
            markSnapshotActive('characters', true)
          }
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

  async function fetchCharacters(force = false): Promise<CharacterBrowse[]> {
    if (fetchPromise.value) return fetchPromise.value
    if (!force && hasLoaded.value) {
      return browseCharacters.value
    }

    fetchPromise.value = (async () => {
      loading.value = true

      try {
        clearError()

        const response =
          await performFetch<CharacterBrowse[]>('/api/characters')

        if (response.success && response.data) {
          // The list endpoint is authoritative and intentionally lightweight.
          // Replace it rather than merging richer legacy/localStorage fields
          // back into browse rows.
          browseCharacters.value = response.data.slice().sort(sortCharacters)
          hasLoaded.value = true
          usingSnapshot.value = false
          markSnapshotActive('characters', false)
          syncToLocalStorage()

          return browseCharacters.value
        }

        throw new Error(response.message || 'Failed to fetch characters')
      } catch (error) {
        handleError(error, 'fetching characters')
        setLastError(error, 'Failed to fetch characters')

        return browseCharacters.value
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

    const existingRequest = fetchCharacterByIdPromises.get(characterId)
    if (existingRequest && !force) return existingRequest

    const request = (async (): Promise<Character | null> => {
      try {
        clearError()

        const response = await performFetch<Character>(
          `/api/characters/${characterId}`,
        )

        if (response.success && response.data) {
          return upsertCharacter(response.data)
        }

        throw new Error(response.message || 'Failed to fetch character')
      } catch (error) {
        handleError(error, 'fetching character by ID')
        setLastError(error, 'Failed to fetch character')
        return null
      } finally {
        fetchCharacterByIdPromises.delete(characterId)
      }
    })()

    fetchCharacterByIdPromises.set(characterId, request)
    return request
  }

  async function selectCharacter(
    input: number | string | Character | CharacterBrowse,
  ) {
    const characterId = normalizeCharacterId(input)

    if (!characterId) return null

    const found = await fetchCharacterById(characterId)

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

  async function startEditingCharacter(
    input?: number | string | Character | CharacterBrowse,
  ) {
    const characterId = normalizeCharacterId(input ?? selectedCharacter.value)

    if (!characterId) {
      startAddingCharacter()
      return null
    }

    const character = await fetchCharacterById(characterId)

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
    input: number | string | Character | CharacterBrowse,
    overrides: Partial<Character> = {},
  ) {
    const characterId = normalizeCharacterId(input)

    if (!characterId) return null

    const source = await fetchCharacterById(characterId)

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
      userId: useUserStore().authenticatedUserId,
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

      // Path-first: prefer the stored path, fall back to inline base64 only for
      // pathless art, then the placeholder.
      const resolved = resolveArtImageSrc(image)
      if (resolved) {
        artImagePath.value = resolved
      } else {
        artImagePath.value = characterPlaceholder
      }
    } catch (error) {
      handleError(error, 'updating character art image path')
      artImagePath.value = characterPlaceholder
    }
  }

  function upsertCharacter(character: Character): Character {
    const detailIndex = characters.value.findIndex(
      (entry) => entry.id === character.id,
    )
    const existingDetail =
      selectedCharacter.value?.id === character.id
        ? selectedCharacter.value
        : detailIndex >= 0
          ? characters.value[detailIndex]
          : undefined
    const mergedDetail = mergeDefinedRecord(existingDetail, character)

    if (detailIndex >= 0) {
      characters.value.splice(detailIndex, 1, mergedDetail)
    } else {
      characters.value.push(mergedDetail)
    }
    characters.value.sort(sortCharacters)

    const browse = toCharacterBrowse(mergedDetail)
    const browseIndex = browseCharacters.value.findIndex(
      (entry) => entry.id === browse.id,
    )
    if (browseIndex >= 0) {
      browseCharacters.value.splice(
        browseIndex,
        1,
        mergeDefinedRecord(browseCharacters.value[browseIndex], browse),
      )
    } else {
      browseCharacters.value.push(browse)
    }
    browseCharacters.value.sort(sortCharacters)

    if (selectedCharacter.value?.id === mergedDetail.id) {
      selectedCharacter.value = mergedDetail
    }
    syncToLocalStorage()
    return mergedDetail
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
        body: JSON.stringify(toCharacterMutationPayload(character)),
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.success && response.data) {
        const merged = upsertCharacter(response.data)
        selectedCharacter.value = merged
        characterForm.value = toCharacterForm(merged)
        await updateArtImagePath()
        void useAchievementStore().rewardAchievementByCode('first-character')

        return merged
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
        body: JSON.stringify(toCharacterMutationPayload(updates)),
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.success && response.data) {
        const merged = upsertCharacter(response.data)
        selectedCharacter.value = merged
        characterForm.value = toCharacterForm(merged)
        await updateArtImagePath()

        return merged
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
        browseCharacters.value = browseCharacters.value.filter(
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
    fetchCharacterByIdPromises.clear()
    fetchCharacterRewardsPromises.value = {}
    hasLoaded.value = false
    lastError.value = null
  }

  return {
    browseCharacters,
    characters,
    usingSnapshot,
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
    /*
     * Promise refs are deliberately NOT returned. In a Pinia setup store a
     * returned ref becomes state, Nuxt serializes state into the SSR payload
     * with devalue, and devalue cannot stringify a Promise -- which returned
     * 500 on every page of the site. They stay private; re-entrancy is
     * unaffected because the functions return the promise VALUE to callers.
     * Guarded by utils/scripts/verifyNoPromiseInStoreState.ts.
     */
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
