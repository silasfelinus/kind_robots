import { defineStore } from 'pinia'
import type { ArtPrompt, Art } from '@prisma/client'
import { errorHandler } from '../server/api/utils/error'

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
      try {
        console.log('About to fetch data...') // Debugging line
        const response = await fetch('/api/art/prompts/all')
        console.log('Fetched data:', response) // Debugging line
        if (response.ok) {
          const data = await response.json()
          this.artPrompts = data.artPrompts
        }
      }
      catch (error: unknown) {
        const handledError = errorHandler(error)
        console.error('Error in fetchArtPrompts:', handledError.message)
      }
    },
    async editArtPrompt(id: number, newPrompt: string) {
      try {
        const response = await fetch('/api/art/prompts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, prompt: newPrompt }),
        })

        const data = await response.json()

        if (data.success) {
          // Update the local store
          const index = this.artPrompts.findIndex(prompt => prompt.id === id)
          if (index !== -1) {
            this.artPrompts[index].prompt = newPrompt
          }
        }
        else {
          throw new Error(data.message)
        }
      }
      catch (error: any) {
        errorHandler({ success: false, message: error.message })
      }
    },

    // Fetch art by a specific prompt ID
    async fetchArtByPromptId(promptId: number) {
      try {
        const response = await fetch(`/api/art/prompts/${promptId}`)
        if (response.ok) {
          this.artByPromptId = await response.json()
        }
      }
      catch (error: unknown) {
        const handledError = errorHandler(error)
        console.error('Error in fetchArtByPromptId:', handledError.message)
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
        }
      }
      catch (error: unknown) {
        const handledError = errorHandler(error)
        console.error('Error in createArtPrompt:', handledError.message)
      }
    },

    // Delete an art prompt by ID
    async deleteArtPrompt(promptId: number) {
      try {
        const response = await fetch(`/api/art/prompts/${promptId}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          this.artPrompts = this.artPrompts.filter(prompt => prompt.id !== promptId)
        }
      }
      catch (error: unknown) {
        const handledError = errorHandler(error)
        console.error('Error in deleteArtPrompt:', handledError.message)
      }
    },
  },
})

export type { ArtPrompt }
