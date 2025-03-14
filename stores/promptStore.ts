import { defineStore } from 'pinia'
import type { Prompt, Art } from '@prisma/client'
import { performFetch, handleError } from './utils'
import { useUserStore } from './userStore'

interface State {
  prompts: Prompt[]
  artByPromptId: Art[]
  selectedPrompt: Prompt | null
  fetchedPrompts: Record<number, Prompt | null>
  promptField: string
  isInitialized: boolean
  promptArray: string[]
  currentPrompt: string
}

export const usePromptStore = defineStore('promptStore', {
  state: (): State => ({
    prompts: [],
    artByPromptId: [],
    selectedPrompt: null,
    fetchedPrompts: {},
    promptField: 'kind robots',
    isInitialized: false,
    promptArray: [],
    currentPrompt: ' ',
  }),

  getters: {
    finalPromptString: (state): string =>
      state.promptArray
        .filter((prompt: string) => prompt.trim() !== '')
        .join(' | '),
  },

  actions: {
    async initialize() {
      if (this.isInitialized) return
      this.loadPromptField()
      await this.fetchPrompts()
      this.isInitialized = true
    },
    async selectPrompt(promptId: number) {
      try {
        if (this.selectedPrompt?.id === promptId) return
        const foundPrompt = this.prompts.find(
          (prompt) => prompt.id === promptId,
        )
        if (!foundPrompt)
          throw new Error(`Prompt with ID ${promptId} not found`)

        this.selectedPrompt = foundPrompt
      } catch (error) {
        handleError(error, 'selecting prompt')
      }
    },

    savePromptField() {
      if (typeof window !== 'undefined') {
        localStorage.setItem('promptField', this.promptField)
      }
    },

    loadPromptField() {
      if (typeof window !== 'undefined') {
        const savedPrompt = localStorage.getItem('promptField')
        if (savedPrompt) {
          this.promptField = savedPrompt
        }
      }
    },

    async fetchPrompts() {
      try {
        const response = await performFetch<Prompt[]>('/api/prompts/')
        this.prompts = response.data || []
      } catch (error) {
        handleError(error, 'fetching prompts')
      }
    },

    addPromptToArray(prompt: string) {
      this.promptArray.push(prompt)
    },

    removePromptFromArray(index: number) {
      this.promptArray.splice(index, 1)
    },

    setPromptsFromString(finalString: string) {
      this.promptArray = finalString
        .split('|')
        .map((prompt: string) => prompt.trim())
    },

    async addPrompt(newPrompt: string, userId: number, botId: number) {
      try {
        const response = await performFetch<Prompt>('/api/prompts', {
          method: 'POST',
          body: JSON.stringify({ prompt: newPrompt, userId, botId }),
        })

        const createdPrompt = response.data || null
        if (createdPrompt) {
          this.prompts.push(createdPrompt)
        }
        return createdPrompt
      } catch (error) {
        handleError(error, 'adding prompt')
      }
    },

    async fetchPromptById(promptId: number): Promise<Prompt | null> {
      if (this.fetchedPrompts[promptId]) return this.fetchedPrompts[promptId]
      try {
        const response = await performFetch<Prompt>(`/api/prompts/${promptId}`)
        const fetchedPrompt = response.data || null
        this.fetchedPrompts[promptId] = fetchedPrompt
        return fetchedPrompt
      } catch (error) {
        handleError(error, 'fetching prompt by ID')
        this.fetchedPrompts[promptId] = null
        return null
      }
    },

    async fetchArtByPromptId(promptId: number) {
      try {
        const response = await performFetch<Art[]>(
          `/api/art/prompt/${promptId}`,
        )
        this.artByPromptId = response.data || []
      } catch (error) {
        handleError(error, 'fetching art by prompt ID')
      }
    },

    async deletePrompt(promptId: number) {
      const userStore = useUserStore()
      const currentUserId = userStore.userId
      const prompt = await this.fetchPromptById(promptId)
      if (!prompt || prompt.userId !== currentUserId) {
        handleError(
          new Error('Unauthorized deletion attempt'),
          'deleting prompt',
        )
        return
      }

      try {
        const response = await performFetch(`/api/prompts/${promptId}`, {
          method: 'DELETE',
        })
        if (response.success) {
          this.prompts = this.prompts.filter((prompt) => prompt.id !== promptId)
        } else {
          throw new Error(response.message)
        }
      } catch (error) {
        handleError(error, 'deleting prompt')
      }
    },

    async updatePromptAtIndex(index: number, value: string) {
      const userStore = useUserStore()
      const prompt = this.prompts[index]
      if (!prompt || prompt.userId !== userStore.userId) {
        handleError(new Error('Unauthorized edit attempt'), 'updating prompt')
        return
      }

      prompt.prompt = value
      this.prompts[index] = prompt
    },

    clearPrompt() {
      this.selectedPrompt = null
    },
  },
})

export type { Prompt }
