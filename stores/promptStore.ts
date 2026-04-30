// /stores/promptStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Prompt, Art } from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from './utils'
import { useUserStore } from './userStore'
import {
  validatePromptString,
  extractPitch,
} from '@/stores/helpers/promptHelper'

export type { Prompt }

type PromptInitializeOptions = {
  force?: boolean
  fetchRemote?: boolean
}

const isClient = typeof window !== 'undefined'

const promptFieldStorageKey = 'promptField'
const promptArrayStorageKey = 'promptArray'
const currentPromptStorageKey = 'currentPrompt'
const promptsStorageKey = 'prompts'
const artByPromptIdStorageKey = 'artByPromptId'

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

export const usePromptStore = defineStore('promptStore', () => {
  const prompts = ref<Prompt[]>([])
  const artByPromptId = ref<Record<number, Art[]>>({})
  const selectedPrompt = ref<Prompt | null>(null)

  const promptField = ref('kind robots')
  const promptArray = ref<string[]>([])
  const currentPrompt = ref('')

  const isInitialized = ref(false)
  const isInitializing = ref(false)
  const hasLoaded = ref(false)
  const loading = ref(false)
  const lastError = ref<string | null>(null)

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchPromise = ref<Promise<Prompt[]> | null>(null)
  const fetchPromptByIdPromises = ref<Record<number, Promise<Prompt | null>>>(
    {},
  )
  const fetchArtByPromptIdPromises = ref<Record<number, Promise<Art[]>>>({})

  const streamedText = ref('')
  const isStreaming = ref(false)

  const finalPromptString = computed(() =>
    promptArray.value.filter((prompt) => prompt.trim() !== '').join(' | '),
  )

  function setLastError(error: unknown, fallback: string): void {
    lastError.value = error instanceof Error ? error.message : fallback
  }

  function clearError(): void {
    lastError.value = null
  }

  function upsertPrompt(prompt: Prompt): void {
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

    syncToLocalStorage()
  }

  function loadFromLocalStorage() {
    const field = safeGetLocalStorage(promptFieldStorageKey)
    const array = safeGetLocalStorage(promptArrayStorageKey)
    const current = safeGetLocalStorage(currentPromptStorageKey)

    if (field) promptField.value = field
    promptArray.value = safeParseArray<string>(array)
    if (current) currentPrompt.value = current

    prompts.value = safeParseArray<Prompt>(
      safeGetLocalStorage(promptsStorageKey),
    ).sort(sortPrompts)

    artByPromptId.value = safeParseObject<Record<number, Art[]>>(
      safeGetLocalStorage(artByPromptIdStorageKey),
      {},
    )
  }

  function syncToLocalStorage() {
    safeSetLocalStorage(promptFieldStorageKey, promptField.value)
    safeSetLocalStorage(
      promptArrayStorageKey,
      JSON.stringify(promptArray.value),
    )
    safeSetLocalStorage(currentPromptStorageKey, currentPrompt.value)
    safeSetLocalStorage(promptsStorageKey, JSON.stringify(prompts.value))
    safeSetLocalStorage(
      artByPromptIdStorageKey,
      JSON.stringify(artByPromptId.value),
    )
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

      return streamedText.value
    } catch (error) {
      handleError(error, 'streaming prompt completion')
      setLastError(error, 'Failed to stream prompt completion')
      return streamedText.value
    } finally {
      isStreaming.value = false
    }
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

  function setPromptsFromString(final: string) {
    promptArray.value = final
      .split('|')
      .map((prompt) => prompt.trim())
      .filter(Boolean)

    syncToLocalStorage()
  }

  async function addPrompt(newPrompt: string, userId: number, botId: number) {
    try {
      clearError()

      const response = await performFetch<Prompt>('/api/prompts', {
        method: 'POST',
        body: JSON.stringify({ prompt: newPrompt, userId, botId }),
      })

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create prompt')
      }

      upsertPrompt(response.data)
      return response.data
    } catch (error) {
      handleError(error, 'adding prompt')
      setLastError(error, 'Failed to add prompt')
      return null
    }
  }

  async function selectPrompt(promptId: number) {
    if (selectedPrompt.value?.id === promptId) return

    const found = prompts.value.find((prompt) => prompt.id === promptId)

    if (found) {
      selectedPrompt.value = found
      syncToLocalStorage()
      return
    }

    const fetched = await fetchPromptById(promptId)

    if (fetched) {
      selectedPrompt.value = fetched
      syncToLocalStorage()
    }
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

        upsertPrompt(response.data)
        return response.data
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

  async function fetchArtByPromptId(promptId: number): Promise<Art[]> {
    if (artByPromptId.value[promptId]) {
      return artByPromptId.value[promptId]
    }

    if (fetchArtByPromptIdPromises.value[promptId]) {
      return fetchArtByPromptIdPromises.value[promptId]
    }

    fetchArtByPromptIdPromises.value[promptId] = (async () => {
      try {
        clearError()

        const response = await performFetch<Art[]>(
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

  async function deletePrompt(promptId: number) {
    const userStore = useUserStore()
    const prompt = await fetchPromptById(promptId)

    if (!prompt || prompt.userId !== userStore.userId) {
      handleError(new Error('Unauthorized deletion attempt'), 'deleting prompt')
      return false
    }

    try {
      clearError()

      const response = await performFetch(`/api/prompts/${promptId}`, {
        method: 'DELETE',
      })

      if (!response.success) {
        throw new Error(response.message)
      }

      prompts.value = prompts.value.filter((prompt) => prompt.id !== promptId)

      if (selectedPrompt.value?.id === promptId) {
        selectedPrompt.value = null
      }

      delete artByPromptId.value[promptId]
      syncToLocalStorage()

      return true
    } catch (error) {
      handleError(error, 'deleting prompt')
      setLastError(error, 'Failed to delete prompt')
      return false
    }
  }

  async function updatePromptAtIndex(index: number, value: string) {
    const userStore = useUserStore()
    const prompt = prompts.value[index]

    if (!prompt || prompt.userId !== userStore.userId) {
      handleError(new Error('Unauthorized edit attempt'), 'updating prompt')
      return false
    }

    prompt.prompt = value
    prompts.value[index] = prompt
    syncToLocalStorage()

    return true
  }

  function clearPrompt() {
    selectedPrompt.value = null
    syncToLocalStorage()
  }

  function resetInitialization() {
    isInitialized.value = false
    isInitializing.value = false
    initializePromise.value = null
    fetchPromise.value = null
    fetchPromptByIdPromises.value = {}
    fetchArtByPromptIdPromises.value = {}
    lastError.value = null
  }

  return {
    prompts,
    artByPromptId,
    selectedPrompt,
    promptField,
    promptArray,
    currentPrompt,

    finalPromptString,
    isInitialized,
    isInitializing,
    hasLoaded,
    loading,
    lastError,
    initializePromise,
    fetchPromise,
    fetchPromptByIdPromises,
    fetchArtByPromptIdPromises,

    initialize,
    resetInitialization,
    fetchPrompts,
    loadFromLocalStorage,
    syncToLocalStorage,
    addPromptToArray,
    removePromptFromArray,
    setPromptsFromString,
    addPrompt,
    selectPrompt,
    fetchPromptById,
    fetchArtByPromptId,
    deletePrompt,
    updatePromptAtIndex,
    clearPrompt,

    validatePromptString,
    extractPitch,
    processPromptPlaceholders,

    streamedText,
    isStreaming,
    streamPromptCompletion,
  }
})
