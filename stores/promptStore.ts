import { defineStore } from 'pinia'
import type { Prompt, Art } from '@prisma/client'
import { useErrorStore, ErrorType } from './../stores/errorStore'

interface State {
  prompts: Prompt[]
  artByPromptId: Art[]
  selectedPrompt: Prompt | null
  fetchedPrompts: Record<number, Prompt | null>
  promptField: string
  isInitialized: boolean
  promptArray: string[] // Stores user-created prompts
}

export const usePromptStore = defineStore('promptStore', {
  state: (): State => ({
    prompts: [],
    artByPromptId: [],
    selectedPrompt: null,
    fetchedPrompts: {},
    promptField: 'kind robots',
    isInitialized: false,
    promptArray: [], // Array to hold user prompts
  }),

  getters: {
    // Computed property to return final prompt string joined by ' | '
    finalPromptString: (state) => {
      return state.promptArray
        .filter((prompt) => prompt.trim() !== '')
        .join(' | ')
    },
  },

  actions: {
    // Initialize promptStore
    async initialize() {
      if (this.isInitialized) return

      if (typeof window !== 'undefined') {
        this.loadPromptField()
      }

      await this.fetchPrompts()
      this.isInitialized = true
    },

    // Save prompt field to localStorage
    savePromptField() {
      if (typeof window !== 'undefined') {
        localStorage.setItem('promptField', this.promptField)
      }
    },

    // Load prompt field from localStorage
    loadPromptField() {
      if (typeof window !== 'undefined') {
        const savedPrompt = localStorage.getItem('promptField')
        if (savedPrompt) {
          this.promptField = savedPrompt
        }
      }
    },

    // Fetch all art prompts
    async fetchPrompts() {
      const errorStore = useErrorStore()

      try {
        const response = await fetch('/api/prompts/')
        if (!response.ok) throw new Error(await response.text())
        const data = await response.json()
        this.prompts = data.prompts
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `Error fetching art prompts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    },

    // Add new prompt to the store's array
    addPromptToArray(prompt: string) {
      this.promptArray.push(prompt)
    },

    // Remove a prompt from the store's array by index
    removePromptFromArray(index: number) {
      this.promptArray.splice(index, 1)
    },

    // Split a final prompt string back into an array, splitting by '|'
    setPromptsFromString(finalString: string) {
      this.promptArray = finalString.split('|').map((prompt) => prompt.trim())
    },

    // Enhanced addPrompt method
    async addPrompt(newPrompt: string, userId: number, botId: number) {
      const errorStore = useErrorStore()
      console.log('Attempting to add new prompt:', { newPrompt, userId, botId })

      try {
        const response = await fetch('/api/prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: newPrompt,
            userId,
            botId,
          }),
        })

        if (!response.ok) {
          const errorMessage = await response.text()
          console.error('Error response from /api/prompts:', errorMessage)
          throw new Error(errorMessage)
        }
        const apiResponse = await response.json()
        const createdPrompt = apiResponse.newPrompt
        console.log('Prompt created successfully:', createdPrompt)
        this.prompts.push(createdPrompt)
        return createdPrompt
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        console.error('Error in addPrompt:', errorMessage)

        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `Error creating prompt: ${errorMessage}`,
        )
      }
    },

    async fetchPromptById(promptId: number): Promise<Prompt | null> {
      const errorStore = useErrorStore()
      console.log('Fetching prompt by ID:', promptId)

      try {
        if (this.fetchedPrompts[promptId]) {
          console.log('Using cached prompt for ID:', promptId)
          return this.fetchedPrompts[promptId]
        }

        const response = await fetch(`/api/prompts/${promptId}`)
        if (!response.ok) {
          const errorMessage = await response.text()
          console.error(
            'Error response from /api/prompts/{promptId}:',
            errorMessage,
          )
          throw new Error(errorMessage)
        }

        const fetchedPrompt = await response.json()
        console.log('Fetched prompt successfully:', fetchedPrompt)
        this.fetchedPrompts[promptId] = fetchedPrompt
        return fetchedPrompt
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        console.error('Error fetching prompt by ID:', errorMessage)

        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `Error fetching prompt by ID: ${errorMessage}`,
        )
        this.fetchedPrompts[promptId] = null
        return null
      }
    },

    // Enhanced fetchArtByPromptId method
    async fetchArtByPromptId(promptId: number) {
      const errorStore = useErrorStore()
      console.log('Fetching art by prompt ID:', promptId)

      try {
        const response = await fetch(`/api/art/prompt/${promptId}`)
        if (!response.ok) {
          const errorMessage = await response.text()
          console.error(
            'Error response from /api/art/prompt/{promptId}:',
            errorMessage,
          )
          throw new Error(errorMessage)
        }

        this.artByPromptId = await response.json()
        console.log(
          'Art fetched successfully for prompt ID:',
          promptId,
          this.artByPromptId,
        )
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        console.error('Error fetching art by prompt ID:', errorMessage)

        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `Error fetching art by prompt ID: ${errorMessage}`,
        )
      }
    },
    // Delete a prompt by ID with ownership check
    async deletePrompt(promptId: number) {
      const errorStore = useErrorStore()
      const userStore = useUserStore()
      const currentUserId = userStore.userId

      try {
        // Fetch the prompt to check if it belongs to the current user
        const prompt = await this.fetchPromptById(promptId)
        if (!prompt || prompt.userId !== currentUserId) {
          errorStore.setError(
            ErrorType.AUTH_ERROR,
            'You are not authorized to delete this prompt.',
          )
          return
        }

        // Proceed to delete if the user owns the prompt
        const response = await fetch(`/api/prompts/${promptId}`, {
          method: 'DELETE',
        })

        if (!response.ok) throw new Error(await response.text())

        // Update store after successful deletion
        this.prompts = this.prompts.filter((prompt) => prompt.id !== promptId)
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `Error deleting prompt: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    },

    async updatePromptAtIndex(index: number, value: string) {
      const errorStore = useErrorStore()
      const userStore = useUserStore()
      const currentUserId = userStore.userId

      try {
        const prompt = this.prompts[index]

        if (!prompt || prompt.userId !== currentUserId) {
          errorStore.setError(
            ErrorType.AUTH_ERROR,
            'You are not authorized to edit this prompt.',
          )
          return
        }

        prompt.prompt = value // Use 'prompt' field instead of 'promptField'
        this.prompts[index] = prompt
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `Error updating prompt: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    },

    // Select a prompt
    selectPrompt(prompt: Prompt) {
      this.selectedPrompt = prompt
    },

    // Clear selected prompt
    clearPrompt() {
      this.selectedPrompt = null
    },
  },
})

export type { Prompt }
