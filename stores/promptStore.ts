import { defineStore } from 'pinia'
import type { Prompt, Art } from '@prisma/client'
import { useErrorStore, ErrorType } from './../stores/errorStore' // Import useErrorStore and ErrorType

interface State {
  prompts: Prompt[]
  artByPromptId: Art[]
  selectedPrompt: Prompt | null
}

export const usePromptStore = defineStore('promptStore', {
  state: (): State => ({
    prompts: [],
    artByPromptId: [],
    selectedPrompt: null,
  }),

  actions: {
    // Fetch all art prompts
    async fetchPrompts() {
      const errorStore = useErrorStore()

      try {
        const response = await fetch('/api/art/prompts/all')
        if (response.ok) {
          const data = await response.json()
          this.prompts = data.prompts
        } else {
          const errorText = await response.text()
          errorStore.setError(ErrorType.VALIDATION_ERROR, `Failed to fetch art prompts: ${errorText}`)
        }
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, `Error in fetchPrompts: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    },

    // Fetch art by a specific prompt ID
    async fetchArtByPromptId(promptId: number) {
      const errorStore = useErrorStore()

      try {
        const response = await fetch(`/api/art/prompts/${promptId}`)
        if (response.ok) {
          this.artByPromptId = await response.json()
        } else {
          const errorText = await response.text()
          errorStore.setError(ErrorType.VALIDATION_ERROR, `Failed to fetch art by prompt ID: ${errorText}`)
        }
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, `Error in fetchArtByPromptId: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    },

    // Create a new art prompt
    async createPrompt(newPrompt: string) {
      const errorStore = useErrorStore()

      try {
        const response = await fetch('/api/art/prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: newPrompt }),
        })
        if (response.ok) {
          const createdPrompt = await response.json()
          this.prompts.push(createdPrompt)
        } else {
          const errorText = await response.text()
          errorStore.setError(ErrorType.VALIDATION_ERROR, `Failed to create art prompt: ${errorText}`)
        }
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, `Error in createPrompt: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    },

    // Edit an art prompt
    async editPrompt(id: number, newPrompt: string) {
      const errorStore = useErrorStore()

      try {
        const response = await fetch('/api/art/prompts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, prompt: newPrompt }),
        })

        const data = await response.json()

        if (data.success) {
          const index = this.prompts.findIndex((prompt) => prompt.id === id)
          if (index !== -1) {
            this.prompts[index].prompt = newPrompt
          }
        } else {
          errorStore.setError(ErrorType.VALIDATION_ERROR, `Failed to edit art prompt: ${data.message}`)
        }
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, `Error in editPrompt: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    },

    // Delete an art prompt by ID
    async deletePrompt(promptId: number) {
      const errorStore = useErrorStore()

      try {
        const response = await fetch(`/api/art/prompts/${promptId}`, { method: 'DELETE' })
        if (response.ok) {
          this.prompts = this.prompts.filter((prompt) => prompt.id !== promptId)
        } else {
          const errorText = await response.text()
          errorStore.setError(ErrorType.VALIDATION_ERROR, `Failed to delete art prompt: ${errorText}`)
        }
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, `Error in deletePrompt: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
