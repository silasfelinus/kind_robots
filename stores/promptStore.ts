import { defineStore } from 'pinia'
import type { Prompt, Art } from '@prisma/client'
import { useErrorStore, ErrorType } from './../stores/errorStore' // Import useErrorStore and ErrorType

interface State {
  artPrompts: Prompt[]
  artByPromptId: Art[]
  activePrompt: Prompt | null
}

export const usePromptStore = defineStore('promptStore', {
  // State
  state: (): State => ({
    artPrompts: [],
    artByPromptId: [],
    activePrompt: null,
  }),

  // Actions
  actions: {
    // Fetch all art prompts
    async fetchPrompts() {
      const errorStore = useErrorStore() // Use errorStore

      try {
        console.log('About to fetch data...') // Debugging line
        const response = await fetch('/api/art/prompts/all')
        console.log('Fetched data:', response) // Debugging line
        if (response.ok) {
          const data = await response.json()
          this.artPrompts = data.artPrompts
        } else {
          const errorText = await response.text()
          errorStore.setError(
            ErrorType.VALIDATION_ERROR,
            `Failed to fetch art prompts: ${errorText}`,
          )
          console.error(
            'Failed to fetch art prompts:',
            errorStore.getErrors().slice(-1)[0]?.message,
          )
        }
      } catch {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Error in fetchPrompts')
        console.error(
          'Error in fetchPrompts:',
          errorStore.getErrors().slice(-1)[0]?.message,
        )
      }
    },

    // Edit an art prompt
    async editPrompt(id: number, newPrompt: string) {
      const errorStore = useErrorStore() // Use errorStore

      try {
        const response = await fetch('/api/art/prompts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, prompt: newPrompt }),
        })

        const data = await response.json()

        if (data.success) {
          // Update the local store
          const index = this.artPrompts.findIndex((prompt) => prompt.id === id)
          if (index !== -1) {
            this.artPrompts[index].prompt = newPrompt
          }
        } else {
          throw new Error(data.message)
        }
      } catch {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Error in editPrompt')
        console.error(
          'Error in editPrompt:',
          errorStore.getErrors().slice(-1)[0]?.message,
        )
      }
    },

    // Fetch art by a specific prompt ID
    async fetchArtByPromptId(promptId: number) {
      const errorStore = useErrorStore() // Use errorStore

      try {
        const response = await fetch(`/api/art/prompts/${promptId}`)
        if (response.ok) {
          this.artByPromptId = await response.json()
        } else {
          const errorText = await response.text()
          errorStore.setError(
            ErrorType.VALIDATION_ERROR,
            `Failed to fetch art by prompt ID: ${errorText}`,
          )
          console.error(
            'Failed to fetch art by prompt ID:',
            errorStore.getErrors().slice(-1)[0]?.message,
          )
        }
      } catch {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          'Error in fetchArtByPromptId',
        )
        console.error(
          'Error in fetchArtByPromptId:',
          errorStore.getErrors().slice(-1)[0]?.message,
        )
      }
    },

    selectPrompt(prompt: Prompt) {
      this.activePrompt = prompt // Update the ref value directly
    },

    clearPrompt() {
      this.activePrompt = null // Update the ref value directly
    },

    // Create a new art prompt
    async createPrompt(newPrompt: string) {
      const errorStore = useErrorStore() // Use errorStore

      try {
        const response = await fetch('/api/art/prompts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: newPrompt }),
        })
        if (response.ok) {
          const createdPrompt = await response.json()
          this.artPrompts.push(createdPrompt)
        } else {
          const errorText = await response.text()
          errorStore.setError(
            ErrorType.VALIDATION_ERROR,
            `Failed to create art prompt: ${errorText}`,
          )
          console.error(
            'Failed to create art prompt:',
            errorStore.getErrors().slice(-1)[0]?.message,
          )
        }
      } catch {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Error in createPrompt')
        console.error(
          'Error in createPrompt:',
          errorStore.getErrors().slice(-1)[0]?.message,
        )
      }
    },

    // Delete an art prompt by ID
    async deletePrompt(promptId: number) {
      const errorStore = useErrorStore() // Use errorStore

      try {
        const response = await fetch(`/api/art/prompts/${promptId}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          this.artPrompts = this.artPrompts.filter(
            (prompt) => prompt.id !== promptId,
          )
        } else {
          const errorText = await response.text()
          errorStore.setError(
            ErrorType.VALIDATION_ERROR,
            `Failed to delete art prompt: ${errorText}`,
          )
          console.error(
            'Failed to delete art prompt:',
            errorStore.getErrors().slice(-1)[0]?.message,
          )
        }
      } catch {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Error in deletePrompt')
        console.error(
          'Error in deletePrompt:',
          errorStore.getErrors().slice(-1)[0]?.message,
        )
      }
    },
  },
})

export type { Prompt }
