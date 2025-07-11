// /stores/promptStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Prompt, Art } from '@prisma/client'
import { performFetch, handleError } from './utils'
import { useUserStore } from './userStore'
import {
  validatePromptString,
  extractPitch,
} from '@/stores/helpers/promptHelper'

export type { Prompt }

export const usePromptStore = defineStore('promptStore', () => {
  const prompts = ref<Prompt[]>([])
  const artByPromptId = ref<Art[]>([])
  const selectedPrompt = ref<Prompt | null>(null)
  const promptField = ref('kind robots')
  const isInitialized = ref(false)
  const promptArray = ref<string[]>([])
  const currentPrompt = ref('')

  const finalPromptString = computed(() =>
    promptArray.value.filter((p) => p.trim() !== '').join(' | '),
  )

  function loadFromLocalStorage() {
    if (typeof window === 'undefined') return
    const field = localStorage.getItem('promptField')
    const array = localStorage.getItem('promptArray')
    const current = localStorage.getItem('currentPrompt')

    if (field) promptField.value = field
    if (array) promptArray.value = JSON.parse(array)
    if (current) currentPrompt.value = current
  }

  function syncToLocalStorage() {
    if (typeof window === 'undefined') return
    localStorage.setItem('promptField', promptField.value)
    localStorage.setItem('promptArray', JSON.stringify(promptArray.value))
    localStorage.setItem('currentPrompt', currentPrompt.value)
  }

  async function initialize() {
    if (isInitialized.value) return
    loadFromLocalStorage()
    await fetchPrompts()
    isInitialized.value = true
  }

  async function fetchPrompts() {
    try {
      const response = await performFetch<Prompt[]>('/api/prompts/')
      prompts.value = response.data || []
    } catch (error) {
      handleError(error, 'fetching prompts')
    }
  }

  function addPromptToArray(prompt: string) {
    promptArray.value.push(prompt)
    syncToLocalStorage()
  }

  function removePromptFromArray(index: number) {
    promptArray.value.splice(index, 1)
    syncToLocalStorage()
  }

  const streamedText = ref('')
  const isStreaming = ref(false)

  async function streamPromptCompletion(inputPrompt: string): Promise<string> {
    isStreaming.value = true
    streamedText.value = ''

    try {
      const response = await fetch('/api/prompts/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: inputPrompt }),
      })

      if (!response.ok || !response.body) throw new Error('Stream failed')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        let boundary
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const chunk = buffer.slice(0, boundary).trim()
          buffer = buffer.slice(boundary + 2)

          if (!chunk || chunk === '[DONE]') continue
          try {
            const parsed = JSON.parse(chunk)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) streamedText.value += content
          } catch (err) {
            console.error('Parse error:', err)
          }
        }
      }
    } catch (err) {
      handleError(err, 'streaming prompt completion')
    } finally {
      isStreaming.value = false
    }

    return streamedText.value
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
    promptArray.value = final.split('|').map((p) => p.trim())
    syncToLocalStorage()
  }

  async function addPrompt(newPrompt: string, userId: number, botId: number) {
    try {
      const response = await performFetch<Prompt>('/api/prompts', {
        method: 'POST',
        body: JSON.stringify({ prompt: newPrompt, userId, botId }),
      })
      const created = response.data || null
      if (created) prompts.value.push(created)
      return created
    } catch (error) {
      handleError(error, 'adding prompt')
    }
  }

  async function selectPrompt(promptId: number) {
    try {
      if (selectedPrompt.value?.id === promptId) return
      const found = prompts.value.find((p) => p.id === promptId)
      if (!found) throw new Error(`Prompt with ID ${promptId} not found`)
      selectedPrompt.value = found
    } catch (error) {
      handleError(error, 'selecting prompt')
    }
  }

  async function fetchPromptById(promptId: number): Promise<Prompt | null> {
    const found = prompts.value.find((p) => p.id === promptId)
    if (found) return found

    try {
      const response = await performFetch<Prompt>(`/api/prompts/${promptId}`)
      const prompt = response.data || null
      if (prompt) prompts.value.push(prompt)
      return prompt
    } catch (error) {
      handleError(error, 'fetching prompt by ID')
      return null
    }
  }

  async function fetchArtByPromptId(promptId: number) {
    try {
      const response = await performFetch<Art[]>(`/api/art/prompt/${promptId}`)
      artByPromptId.value = response.data || []
    } catch (error) {
      handleError(error, 'fetching art by prompt ID')
    }
  }

  async function deletePrompt(promptId: number) {
    const userStore = useUserStore()
    const prompt = await fetchPromptById(promptId)
    if (!prompt || prompt.userId !== userStore.userId) {
      handleError(new Error('Unauthorized deletion attempt'), 'deleting prompt')
      return
    }

    try {
      const response = await performFetch(`/api/prompts/${promptId}`, {
        method: 'DELETE',
      })
      if (response.success) {
        prompts.value = prompts.value.filter((p) => p.id !== promptId)
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      handleError(error, 'deleting prompt')
    }
  }

  async function updatePromptAtIndex(index: number, value: string) {
    const userStore = useUserStore()
    const prompt = prompts.value[index]
    if (!prompt || prompt.userId !== userStore.userId) {
      handleError(new Error('Unauthorized edit attempt'), 'updating prompt')
      return
    }
    prompt.prompt = value
    prompts.value[index] = prompt
  }

  function clearPrompt() {
    selectedPrompt.value = null
  }

  return {
    prompts,
    artByPromptId,
    selectedPrompt,
    promptField,
    isInitialized,
    promptArray,
    currentPrompt,
    finalPromptString,
    initialize,
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
