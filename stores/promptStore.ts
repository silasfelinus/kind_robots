// /stores/promptStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ArtImage, Prompt } from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from './utils'
import { useUserStore } from './userStore'
import {
  validatePromptString,
  extractPitch,
} from '@/stores/helpers/promptHelper'

export type CreationSource = 'HUMAN' | 'AI' | 'UNKNOWN' | 'HYBRID' | 'UPLOAD'

export interface PromptForm extends Partial<Prompt> {
  title?: string | null
  designer?: string | null
  isPublic?: boolean
  isMature?: boolean
}

type PromptInitializeOptions = {
  force?: boolean
  fetchRemote?: boolean
  createBlankForm?: boolean
}

type PromptMutationResult = {
  success: boolean
  data?: Prompt
  message: string
}

const isClient = typeof window !== 'undefined'

const storageKeys = {
  promptField: 'promptField',
  promptArray: 'promptArray',
  currentPrompt: 'currentPrompt',
  prompts: 'prompts',
  promptForm: 'promptForm',
  selectedPrompt: 'selectedPrompt',
  artByPromptId: 'artByPromptId',
  streamedText: 'streamedText',
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

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
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

function sortPrompts(a: Prompt, b: Prompt): number {
  return b.id - a.id
}

function defaultPromptForm(userId?: number | null): PromptForm {
  return {
    prompt: '',
    userId: userId || 10,
    galleryId: 21,
    creationSource: 'HUMAN',
    pitchId: null,
    botId: null,
    artImageId: null,
  } as PromptForm
}

function normalizePromptForm(input: Partial<PromptForm>): PromptForm {
  return {
    ...input,
    prompt: input.prompt || '',
    userId: input.userId ?? 10,
    galleryId: input.galleryId ?? 21,
    creationSource: (input.creationSource || 'HUMAN') as CreationSource,
  } as PromptForm
}

export const usePromptStore = defineStore('promptStore', () => {
  const prompts = ref<Prompt[]>([])
  const promptForm = ref<PromptForm>({})
  const artByPromptId = ref<Record<number, ArtImage[]>>({})
  const selectedPrompt = ref<Prompt | null>(null)

  const promptField = ref('kind robots')
  const promptArray = ref<string[]>([])
  const currentPrompt = ref('')

  const isInitialized = ref(false)
  const isInitializing = ref(false)
  const hasLoaded = ref(false)
  const loading = ref(false)
  const isSaving = ref(false)
  const isGeneratingFields = ref(false)
  const lastError = ref<string | null>(null)

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchPromise = ref<Promise<Prompt[]> | null>(null)
  const fetchPromptByIdPromises = ref<Record<number, Promise<Prompt | null>>>(
    {},
  )
  const fetchArtByPromptIdPromises = ref<Record<number, Promise<ArtImage[]>>>(
    {},
  )
  const createPromptPromise = ref<Promise<PromptMutationResult> | null>(null)
  const updatePromptPromises = ref<
    Record<number, Promise<PromptMutationResult>>
  >({})

  const streamedText = ref('')
  const isStreaming = ref(false)

  const userStore = useUserStore()

  const finalPromptString = computed(() => {
    return promptArray.value
      .filter((prompt) => prompt.trim() !== '')
      .join(' | ')
  })

  const selectedPromptId = computed(() => selectedPrompt.value?.id ?? null)

  const ownedPrompts = computed(() => {
    return prompts.value.filter((prompt) => prompt.userId === userStore.userId)
  })

  const pitchPrompts = computed(() => {
    return prompts.value.filter((prompt) => typeof prompt.pitchId === 'number')
  })

  const loosePrompts = computed(() => {
    return prompts.value.filter((prompt) => typeof prompt.pitchId !== 'number')
  })

  const botPrompts = computed(() => {
    return prompts.value.filter((prompt) => typeof prompt.botId === 'number')
  })

  const visiblePrompts = computed(() => {
    if (userStore.isAdmin) return prompts.value

    return prompts.value.filter((prompt) => {
      return !prompt.userId || prompt.userId === userStore.userId
    })
  })

  const hasUnsavedChanges = computed(() => {
    return (
      JSON.stringify(selectedPrompt.value ?? {}) !==
      JSON.stringify(promptForm.value ?? {})
    )
  })

  function setLastError(error: unknown, fallback: string): void {
    lastError.value = error instanceof Error ? error.message : fallback
  }

  function clearError(): void {
    lastError.value = null
  }

  function syncToLocalStorage() {
    safeSetLocalStorage(storageKeys.promptField, promptField.value)
    safeSetLocalStorage(
      storageKeys.promptArray,
      JSON.stringify(promptArray.value),
    )
    safeSetLocalStorage(storageKeys.currentPrompt, currentPrompt.value)
    safeSetLocalStorage(storageKeys.prompts, JSON.stringify(prompts.value))
    safeSetLocalStorage(
      storageKeys.promptForm,
      JSON.stringify(promptForm.value),
    )
    safeSetLocalStorage(
      storageKeys.selectedPrompt,
      JSON.stringify(selectedPrompt.value),
    )
    safeSetLocalStorage(
      storageKeys.artByPromptId,
      JSON.stringify(artByPromptId.value),
    )
    safeSetLocalStorage(storageKeys.streamedText, streamedText.value)
  }

  function loadFromLocalStorage() {
    const field = safeGetLocalStorage(storageKeys.promptField)
    const array = safeGetLocalStorage(storageKeys.promptArray)
    const current = safeGetLocalStorage(storageKeys.currentPrompt)

    if (field) promptField.value = field

    promptArray.value = safeParseArray<string>(array)

    if (current) currentPrompt.value = current

    prompts.value = safeParseArray<Prompt>(
      safeGetLocalStorage(storageKeys.prompts),
    ).sort(sortPrompts)

    promptForm.value = normalizePromptForm(
      safeParseObject<PromptForm>(
        safeGetLocalStorage(storageKeys.promptForm),
        {},
      ),
    )

    selectedPrompt.value = safeParseObject<Prompt | null>(
      safeGetLocalStorage(storageKeys.selectedPrompt),
      null,
    )

    artByPromptId.value = safeParseObject<Record<number, ArtImage[]>>(
      safeGetLocalStorage(storageKeys.artByPromptId),
      {},
    )

    streamedText.value =
      safeGetLocalStorage(storageKeys.streamedText) ?? streamedText.value
  }

  function upsertPrompt(prompt: Prompt): Prompt {
    const index = prompts.value.findIndex((entry) => entry.id === prompt.id)

    if (index >= 0) {
      prompts.value.splice(index, 1, prompt)
    } else {
      prompts.value.push(prompt)
    }

    prompts.value.sort(sortPrompts)

    if (selectedPrompt.value?.id === prompt.id) {
      selectedPrompt.value = prompt
    }

    if (promptForm.value.id === prompt.id) {
      promptForm.value = normalizePromptForm(prompt as PromptForm)
    }

    syncToLocalStorage()

    return prompt
  }

  function removePromptLocally(promptId: number) {
    prompts.value = prompts.value.filter((prompt) => prompt.id !== promptId)

    if (selectedPrompt.value?.id === promptId) {
      selectedPrompt.value = null
      promptForm.value = {}
    }

    delete artByPromptId.value[promptId]
    syncToLocalStorage()
  }

  function setPromptForm(updates: Partial<PromptForm>) {
    promptForm.value = normalizePromptForm({
      ...promptForm.value,
      ...updates,
    })

    syncToLocalStorage()
  }

  function createBlankPromptForm() {
    promptForm.value = defaultPromptForm(userStore.userId)
    syncToLocalStorage()
  }

  function startAddingPrompt() {
    selectedPrompt.value = null
    createBlankPromptForm()
  }

  async function startEditingPrompt(promptId?: number): Promise<Prompt | null> {
    const id = promptId ?? selectedPrompt.value?.id

    if (!id) return null

    const prompt = await fetchPromptById(id)

    if (!prompt) return null

    selectedPrompt.value = prompt
    promptForm.value = normalizePromptForm(prompt as PromptForm)
    currentPrompt.value = prompt.prompt
    promptField.value = prompt.prompt

    syncToLocalStorage()

    return prompt
  }

  async function startCloningPrompt(
    promptId: number,
  ): Promise<PromptForm | null> {
    const prompt = await fetchPromptById(promptId)

    if (!prompt) return null

    selectedPrompt.value = null

    promptForm.value = normalizePromptForm({
      ...prompt,
      id: undefined,
      prompt: `${prompt.prompt}`,
      creationSource: 'HYBRID',
      userId: userStore.userId || 10,
    })

    currentPrompt.value = prompt.prompt
    promptField.value = prompt.prompt

    syncToLocalStorage()

    return promptForm.value
  }

  function deselectPrompt() {
    selectedPrompt.value = null
    promptForm.value = {}
    currentPrompt.value = ''
    syncToLocalStorage()
  }

  async function initialize(
    options: PromptInitializeOptions = {},
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
          await fetchPrompts(Boolean(options.force))
        }

        if (
          options.createBlankForm !== false &&
          Object.keys(promptForm.value).length === 0
        ) {
          createBlankPromptForm()
        }

        isInitialized.value = true
      } catch (error) {
        isInitialized.value = false
        handleError(error, 'initializing prompt store')
        setLastError(error, 'Failed to initialize prompt store')
      } finally {
        isInitializing.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function fetchPrompts(force = false): Promise<Prompt[]> {
    if (!force && hasLoaded.value && prompts.value.length) return prompts.value
    if (fetchPromise.value && !force) return fetchPromise.value

    fetchPromise.value = (async () => {
      loading.value = true

      try {
        clearError()

        const response = await performFetch<Prompt[]>('/api/prompts')

        if (!response.success || !Array.isArray(response.data)) {
          throw new Error(response.message || 'Invalid prompt response')
        }

        prompts.value = response.data.slice().sort(sortPrompts)
        hasLoaded.value = true
        syncToLocalStorage()

        return prompts.value
      } catch (error) {
        hasLoaded.value = false
        handleError(error, 'fetching prompts')
        setLastError(error, 'Failed to fetch prompts')
        return prompts.value
      } finally {
        loading.value = false
        fetchPromise.value = null
      }
    })()

    return fetchPromise.value
  }

  async function fetchPromptById(promptId: number): Promise<Prompt | null> {
    const found = prompts.value.find((prompt) => prompt.id === promptId)
    if (found) return found

    if (fetchPromptByIdPromises.value[promptId]) {
      return fetchPromptByIdPromises.value[promptId]
    }

    fetchPromptByIdPromises.value[promptId] = (async () => {
      try {
        clearError()

        const response = await performFetch<Prompt>(`/api/prompts/${promptId}`)

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch prompt')
        }

        return upsertPrompt(response.data)
      } catch (error) {
        handleError(error, 'fetching prompt by ID')
        setLastError(error, 'Failed to fetch prompt')
        return null
      } finally {
        delete fetchPromptByIdPromises.value[promptId]
      }
    })()

    return fetchPromptByIdPromises.value[promptId]
  }

  async function fetchArtByPromptId(promptId: number): Promise<ArtImage[]> {
    if (artByPromptId.value[promptId]) {
      return artByPromptId.value[promptId]
    }

    if (fetchArtByPromptIdPromises.value[promptId]) {
      return fetchArtByPromptIdPromises.value[promptId]
    }

    fetchArtByPromptIdPromises.value[promptId] = (async () => {
      try {
        clearError()

        const response = await performFetch<ArtImage[]>(
          `/api/art/prompt/${promptId}`,
        )

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch art')
        }

        artByPromptId.value[promptId] = response.data
        syncToLocalStorage()

        return response.data
      } catch (error) {
        handleError(error, 'fetching art by prompt ID')
        setLastError(error, 'Failed to fetch art by prompt')
        return []
      } finally {
        delete fetchArtByPromptIdPromises.value[promptId]
      }
    })()

    return fetchArtByPromptIdPromises.value[promptId]
  }

  async function createPrompt(
    payload: Partial<PromptForm>,
  ): Promise<PromptMutationResult> {
    if (createPromptPromise.value) {
      return createPromptPromise.value
    }

    createPromptPromise.value = (async () => {
      try {
        clearError()

        const cleanPrompt = payload.prompt?.trim()

        if (!cleanPrompt) {
          throw new Error('Prompt text is required')
        }

        const response = await performFetch<Prompt>('/api/prompts', {
          method: 'POST',
          body: JSON.stringify({
            ...payload,
            prompt: cleanPrompt,
            userId: payload.userId ?? userStore.userId ?? 10,
            galleryId: payload.galleryId ?? 21,
            creationSource: payload.creationSource ?? 'HUMAN',
          }),
        })

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to create prompt')
        }

        const created = upsertPrompt(response.data)

        selectedPrompt.value = created
        promptForm.value = normalizePromptForm(created as PromptForm)
        promptField.value = created.prompt
        currentPrompt.value = created.prompt

        syncToLocalStorage()

        return {
          success: true,
          data: created,
          message: 'Prompt created',
        }
      } catch (error) {
        handleError(error, 'creating prompt')
        setLastError(error, 'Failed to create prompt')

        return {
          success: false,
          message:
            error instanceof Error ? error.message : 'Failed to create prompt',
        }
      } finally {
        createPromptPromise.value = null
      }
    })()

    return createPromptPromise.value
  }

  async function updatePrompt(
    promptId: number,
    updates: Partial<PromptForm>,
  ): Promise<PromptMutationResult> {
    if (updatePromptPromises.value[promptId]) {
      return updatePromptPromises.value[promptId]
    }

    updatePromptPromises.value[promptId] = (async () => {
      try {
        clearError()

        const response = await performFetch<Prompt>(
          `/api/prompts/${promptId}`,
          {
            method: 'PATCH',
            body: JSON.stringify(updates),
          },
        )

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to update prompt')
        }

        const updated = upsertPrompt(response.data)

        selectedPrompt.value = updated
        promptForm.value = normalizePromptForm(updated as PromptForm)
        promptField.value = updated.prompt
        currentPrompt.value = updated.prompt

        syncToLocalStorage()

        return {
          success: true,
          data: updated,
          message: 'Prompt updated',
        }
      } catch (error) {
        handleError(error, 'updating prompt')
        setLastError(error, 'Failed to update prompt')

        return {
          success: false,
          message:
            error instanceof Error ? error.message : 'Failed to update prompt',
        }
      } finally {
        delete updatePromptPromises.value[promptId]
      }
    })()

    return updatePromptPromises.value[promptId]
  }

  async function savePrompt(): Promise<PromptMutationResult> {
    isSaving.value = true

    try {
      clearError()

      const payload = normalizePromptForm({
        ...promptForm.value,
        prompt:
          promptForm.value.prompt?.trim() ||
          currentPrompt.value.trim() ||
          promptField.value.trim(),
        userId: promptForm.value.userId ?? userStore.userId ?? 10,
      })

      if (typeof payload.id === 'number') {
        return await updatePrompt(payload.id, payload)
      }

      return await createPrompt(payload)
    } finally {
      isSaving.value = false
    }
  }

  async function deletePrompt(promptId: number): Promise<boolean> {
    const prompt = await fetchPromptById(promptId)

    if (!prompt) {
      handleError(new Error('Prompt not found'), 'deleting prompt')
      return false
    }

    if (
      !userStore.isAdmin &&
      typeof prompt.userId === 'number' &&
      prompt.userId !== userStore.userId
    ) {
      handleError(new Error('Unauthorized deletion attempt'), 'deleting prompt')
      return false
    }

    try {
      clearError()

      const response = await performFetch(`/api/prompts/${promptId}`, {
        method: 'DELETE',
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete prompt')
      }

      removePromptLocally(promptId)

      return true
    } catch (error) {
      handleError(error, 'deleting prompt')
      setLastError(error, 'Failed to delete prompt')
      return false
    }
  }

  async function deletePromptById(
    promptId: number,
  ): Promise<PromptMutationResult> {
    const deleted = await deletePrompt(promptId)

    return {
      success: deleted,
      message: deleted ? 'Prompt deleted' : lastError.value || 'Delete failed',
    }
  }

  async function addPrompt(
    newPrompt: string,
    userId = userStore.userId || 10,
    botId?: number | null,
    pitchId?: number | null,
  ): Promise<Prompt | null> {
    const result = await createPrompt({
      prompt: newPrompt,
      userId,
      botId: botId ?? null,
      pitchId: pitchId ?? null,
      creationSource: 'HUMAN',
    })

    return result.data || null
  }

  async function selectPrompt(promptId: number) {
    if (selectedPrompt.value?.id === promptId) return

    const fetched = await fetchPromptById(promptId)

    if (fetched) {
      selectedPrompt.value = fetched
      promptForm.value = normalizePromptForm(fetched as PromptForm)
      currentPrompt.value = fetched.prompt
      promptField.value = fetched.prompt
      syncToLocalStorage()
    }
  }

  function usePrompt(prompt: Prompt | string) {
    const value = typeof prompt === 'string' ? prompt : prompt.prompt

    promptField.value = value
    currentPrompt.value = value

    if (typeof prompt !== 'string') {
      selectedPrompt.value = prompt
      promptForm.value = normalizePromptForm(prompt as PromptForm)
    }

    syncToLocalStorage()
  }

  function addPromptToArray(prompt: string) {
    const cleanPrompt = prompt.trim()
    if (!cleanPrompt) return

    promptArray.value.push(cleanPrompt)
    syncToLocalStorage()
  }

  function removePromptFromArray(index: number) {
    if (index < 0 || index >= promptArray.value.length) return

    promptArray.value.splice(index, 1)
    syncToLocalStorage()
  }

  function setPromptsFromString(final: string) {
    promptArray.value = final
      .split('|')
      .map((prompt) => prompt.trim())
      .filter(Boolean)

    syncToLocalStorage()
  }

  function processPromptPlaceholders(prompt: string): string {
    return prompt
      .replace(/__(.*?)__/g, '$1')
      .replace(
        /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF])+/g,
        '',
      )
      .replace(/\./g, ',')
      .replace(/\s+/g, ' ')
      .trim()
  }

  async function updatePromptAtIndex(index: number, value: string) {
    const prompt = prompts.value[index]

    if (!prompt) {
      handleError(new Error('Prompt not found'), 'updating prompt')
      return false
    }

    if (
      !userStore.isAdmin &&
      typeof prompt.userId === 'number' &&
      prompt.userId !== userStore.userId
    ) {
      handleError(new Error('Unauthorized edit attempt'), 'updating prompt')
      return false
    }

    const result = await updatePrompt(prompt.id, { prompt: value })

    return result.success
  }

  async function attachToPitch(promptId: number, pitchId: number) {
    return await updatePrompt(promptId, { pitchId })
  }

  async function detachFromPitch(promptId: number) {
    return await updatePrompt(promptId, { pitchId: null })
  }

  async function promoteToPitch(promptId?: number) {
    const id = promptId ?? selectedPrompt.value?.id

    if (!id) {
      return {
        success: false,
        message: 'No prompt selected',
      }
    }

    const prompt = await fetchPromptById(id)

    if (!prompt) {
      return {
        success: false,
        message: 'Prompt not found',
      }
    }

    const { usePitchStore, PitchType } = await import('./pitchStore')
    const pitchStore = usePitchStore()

    const result = await pitchStore.createPitch({
      title: prompt.prompt.slice(0, 80),
      pitch: prompt.prompt,
      description: prompt.prompt.slice(0, 256),
      PitchType: PitchType.ARTPITCH,
      creationSource: 'HYBRID',
      userId: prompt.userId ?? userStore.userId ?? 10,
    })

    if (result.success && result.data?.id) {
      await attachToPitch(prompt.id, result.data.id)
    }

    return result
  }

  async function generateVariation(promptId?: number) {
    const id = promptId ?? selectedPrompt.value?.id
    const basePrompt =
      id !== undefined
        ? (await fetchPromptById(id))?.prompt
        : promptForm.value.prompt || currentPrompt.value || promptField.value

    if (!basePrompt?.trim()) {
      return {
        success: false,
        message: 'No prompt available to vary',
      }
    }

    const text = await streamPromptCompletion(
      `Create a strong variation of this prompt. Keep it concise and vivid:\n\n${basePrompt}`,
    )

    if (!text.trim()) {
      return {
        success: false,
        message: 'No variation returned',
      }
    }

    promptForm.value.prompt = text.trim()
    currentPrompt.value = text.trim()
    promptField.value = text.trim()
    syncToLocalStorage()

    return {
      success: true,
      message: 'Prompt variation generated',
      data: text.trim(),
    }
  }

  async function generateFields(fieldsToUpgrade: string[]) {
    isGeneratingFields.value = true

    try {
      clearError()

      const response = await performFetch<Partial<Prompt>>(
        '/api/prompts/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            prompt: promptForm.value,
            fieldsToUpgrade,
          }),
        },
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to generate prompt fields')
      }

      setPromptForm(response.data as Partial<PromptForm>)

      return {
        success: true,
        message: 'Prompt fields generated',
      }
    } catch (error) {
      handleError(error, 'generating prompt fields')
      setLastError(error, 'Failed to generate prompt fields')

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to generate prompt fields',
      }
    } finally {
      isGeneratingFields.value = false
    }
  }

  async function streamPromptCompletion(inputPrompt: string): Promise<string> {
    isStreaming.value = true
    streamedText.value = ''

    try {
      clearError()

      const response = await fetch('/api/prompts/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: inputPrompt }),
      })

      if (!response.ok || !response.body) {
        throw new Error('Stream failed')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })

        let boundary = buffer.indexOf('\n\n')

        while (boundary !== -1) {
          const chunk = buffer.slice(0, boundary).trim()
          buffer = buffer.slice(boundary + 2)

          if (chunk && chunk !== '[DONE]') {
            try {
              const parsed = JSON.parse(chunk)
              const content = parsed.choices?.[0]?.delta?.content

              if (content) {
                streamedText.value += content
              }
            } catch (error) {
              handleError(error, 'parsing streamed prompt chunk')
            }
          }

          boundary = buffer.indexOf('\n\n')
        }
      }

      syncToLocalStorage()

      return streamedText.value
    } catch (error) {
      handleError(error, 'streaming prompt completion')
      setLastError(error, 'Failed to stream prompt completion')
      return streamedText.value
    } finally {
      isStreaming.value = false
    }
  }

  function clearPrompt() {
    selectedPrompt.value = null
    promptForm.value = {}
    currentPrompt.value = ''
    syncToLocalStorage()
  }

  function clearPromptField() {
    promptField.value = ''
    currentPrompt.value = ''
    syncToLocalStorage()
  }

  function clearLocalStorage() {
    Object.values(storageKeys).forEach((key) => safeRemoveLocalStorage(key))
  }

  function resetInitialization() {
    isInitialized.value = false
    isInitializing.value = false
    initializePromise.value = null
    fetchPromise.value = null
    fetchPromptByIdPromises.value = {}
    fetchArtByPromptIdPromises.value = {}
    createPromptPromise.value = null
    updatePromptPromises.value = {}
    lastError.value = null
  }

  return {
    prompts,
    promptForm,
    artByPromptId,
    selectedPrompt,
    promptField,
    promptArray,
    currentPrompt,

    finalPromptString,
    selectedPromptId,
    ownedPrompts,
    pitchPrompts,
    loosePrompts,
    botPrompts,
    visiblePrompts,
    hasUnsavedChanges,

    isInitialized,
    isInitializing,
    hasLoaded,
    loading,
    isSaving,
    isGeneratingFields,
    lastError,
    initializePromise,
    fetchPromise,
    fetchPromptByIdPromises,
    fetchArtByPromptIdPromises,
    createPromptPromise,
    updatePromptPromises,

    initialize,
    resetInitialization,
    fetchPrompts,
    fetchPromptById,
    fetchArtByPromptId,
    loadFromLocalStorage,
    syncToLocalStorage,

    setPromptForm,
    createBlankPromptForm,
    startAddingPrompt,
    startEditingPrompt,
    startCloningPrompt,
    deselectPrompt,

    upsertPrompt,
    createPrompt,
    updatePrompt,
    savePrompt,
    addPrompt,
    selectPrompt,
    usePrompt,
    deletePrompt,
    deletePromptById,
    updatePromptAtIndex,

    addPromptToArray,
    removePromptFromArray,
    setPromptsFromString,
    clearPrompt,
    clearPromptField,
    clearLocalStorage,

    attachToPitch,
    detachFromPitch,
    promoteToPitch,
    generateVariation,
    generateFields,

    validatePromptString,
    extractPitch,
    processPromptPlaceholders,

    streamedText,
    isStreaming,
    streamPromptCompletion,
  }
})

export type { Prompt }
