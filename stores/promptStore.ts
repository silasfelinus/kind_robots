import { defineStore } from 'pinia'
import type { ArtPrompt, Art } from '@prisma/client'
import { useErrorStore, ErrorType } from './../stores/errorStore' // Import useErrorStore and ErrorType

interface State {
  artPrompts: ArtPrompt[]
  artByPromptId: Art[]
  activePrompt: ArtPrompt | null
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
    async fetchArtPrompts() {
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
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Error in fetchArtPrompts')
        console.error(
          'Error in fetchArtPrompts:',
          errorStore.getErrors().slice(-1)[0]?.message,
        )
      }
    },

    // Edit an art prompt
    async editArtPrompt(id: number, newPrompt: string) {
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
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Error in editArtPrompt')
        console.error(
          'Error in editArtPrompt:',
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

    selectPrompt(prompt: ArtPrompt) {
      this.activePrompt = prompt // Update the ref value directly
    },

    clearPrompt() {
      this.activePrompt = null // Update the ref value directly
    },

    // Create a new art prompt
    async createArtPrompt(newPrompt: string) {
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
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Error in createArtPrompt')
        console.error(
          'Error in createArtPrompt:',
          errorStore.getErrors().slice(-1)[0]?.message,
        )
      }
    },

    // Delete an art prompt by ID
    async deleteArtPrompt(promptId: number) {
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
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Error in deleteArtPrompt')
        console.error(
          'Error in deleteArtPrompt:',
          errorStore.getErrors().slice(-1)[0]?.message,
        )
      }
    },
  },
})

export type { ArtPrompt }
