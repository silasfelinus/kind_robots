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
  promptArray: string[] 
}

export const usePromptStore = defineStore('promptStore', {
  state: (): State => ({
    prompts: [],
    artByPromptId: [],
    selectedPrompt: null,
    fetchedPrompts: {}, // Initialize fetched prompts as an empty object
    promptField: 'kind robots',
    isInitialized: false, 
    promptArray: [], 
  }),

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

    // Directly update prompt array
    updatePromptArray(newPrompts: string[]) {
      this.promptArray = newPrompts
    },

// Store the prompt strings as they are entered
addPromptToArray(prompt: string) {
  this.promptArray.push(prompt);
},

// Remove prompt by index
removePromptFromArray(index: number) {
  this.promptArray.splice(index, 1);
},

// Construct the final prompt string (joined by quotes)
getFinalPromptString(): string {
  return this.promptArray.map(prompt => `"${prompt}"`).join('');
},

// Split a final prompt string back into an array (split by quotes)
setPromptsFromString(finalString: string) {
  this.promptArray = finalString.split(/"(?=[^"]*"(?![^"]*"))/).filter(Boolean).map(p => p.replace(/"/g, ''));
},


    // Save the promptArray when creating or editing a bot
    async savePromptsForBot(botId: number) {
      const errorStore = useErrorStore()
      try {
        const response = await fetch('/api/prompts/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botId,
            prompts: this.promptArray,
          }),
        })
        if (!response.ok) throw new Error(await response.text())
        const savedData = await response.json()
        this.prompts.push(...savedData.savedPrompts) // Append saved prompts to store
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `Error saving prompts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    },


    // Fetch a prompt by ID and store it in fetchedPrompts
    async fetchPromptById(promptId: number) {
      const errorStore = useErrorStore()

      try {
        if (this.fetchedPrompts[promptId]) return // Return cached prompt if it exists
        const response = await fetch(`/api/art/prompts/${promptId}`)
        if (!response.ok) throw new Error(await response.text())
        const fetchedPrompt = await response.json()
        this.fetchedPrompts[promptId] = fetchedPrompt
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `Error fetching prompt by ID: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
        this.fetchedPrompts[promptId] = null
      }
    },

    // Fetch art by a specific prompt ID
    async fetchArtByPromptId(promptId: number) {
      const errorStore = useErrorStore()

      try {
        const response = await fetch(`/api/art/prompts/${promptId}/art`)
        if (!response.ok) throw new Error(await response.text())
        this.artByPromptId = await response.json()
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `Error fetching art by prompt ID: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    },
        // Add a new prompt (general text prompt)
        async addPrompt(newPrompt: string, userId: number, botId: number) {
          const errorStore = useErrorStore()
    
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
            if (!response.ok) throw new Error(await response.text())
            const createdPrompt = await response.json()
            this.prompts.push(createdPrompt)
            return createdPrompt
          } catch (error) {
            errorStore.setError(
              ErrorType.NETWORK_ERROR,
              `Error creating prompt: ${error instanceof Error ? error.message : 'Unknown error'}`,
            )
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
        if (!response.ok) throw new Error(await response.text())
        const createdPrompt = await response.json()
        this.prompts.push(createdPrompt)
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `Error creating art prompt: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
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
          if (index !== -1) this.prompts[index].prompt = newPrompt
        } else {
          throw new Error(data.message)
        }
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `Error editing art prompt: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    },

    // Delete an art prompt by ID
    async deletePrompt(promptId: number) {
      const errorStore = useErrorStore()

      try {
        const response = await fetch(`/api/art/prompts/${promptId}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error(await response.text())
        this.prompts = this.prompts.filter((prompt) => prompt.id !== promptId)
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `Error deleting art prompt: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
