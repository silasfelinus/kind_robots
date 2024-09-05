import { defineStore } from 'pinia'
import type { Reaction } from '@prisma/client'

interface ReactionState {
  reactions: Reaction[]
  loading: boolean
  error: string | null
}

export const useReactionStore = defineStore('reactionStore', {
  state: (): ReactionState => ({
    reactions: [],
    loading: false,
    error: null,
  }),

  getters: {
    // Get reactions for a specific component by component ID
    getReactionsByComponentId: (state) => (componentId: number) =>
      state.reactions.filter((reaction) => reaction.componentId === componentId),
    
    // Check if the user has reacted to the component (based on userId)
    getUserReactionForComponent: (state) => (componentId: number, userId: number) => 
      state.reactions.find(reaction => reaction.componentId === componentId && reaction.userId === userId),
    // Get total reactions for a specific reaction type (e.g., isClapped, isBooed)
    getTotalReactionsForComponent: (state) => (componentId: number, reactionType: keyof Reaction) =>
      state.reactions.filter((reaction) => reaction.componentId === componentId && reaction[reactionType]).length,
  },

  actions: {
    // Fetch reactions for a specific component
    async fetchReactionsByComponentId(componentId: number) {
      this.loading = true
      try {
        const response = await fetch(`/api/reactions/component/${componentId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch reactions')
        }
        const data = await response.json()
        this.reactions = data.reactions
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error'
      } finally {
        this.loading = false
      }
    },

    // Create a new reaction for a component
    async createReaction(reactionData: Partial<Reaction>) {
      this.loading = true
      try {
        const response = await fetch('/api/reactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reactionData),
        })
        if (!response.ok) {
          throw new Error('Failed to create reaction')
        }
        const newReaction = await response.json()
        this.reactions.push(newReaction)
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error'
      } finally {
        this.loading = false
      }
    },

    // Update an existing reaction
    async updateReaction(reactionId: number, reactionData: Partial<Reaction>) {
      this.loading = true
      try {
        const response = await fetch(`/api/reactions/${reactionId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reactionData),
        })
        if (!response.ok) {
          throw new Error('Failed to update reaction')
        }
        const updatedReaction = await response.json()
        const index = this.reactions.findIndex(r => r.id === reactionId)
        if (index !== -1) {
          this.reactions[index] = updatedReaction
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error'
      } finally {
        this.loading = false
      }
    },

    // Delete a reaction
    async deleteReaction(reactionId: number) {
      this.loading = true
      try {
        const response = await fetch(`/api/reactions/${reactionId}`, {
          method: 'DELETE',
        })
        if (!response.ok) {
          throw new Error('Failed to delete reaction')
        }
        this.reactions = this.reactions.filter(reaction => reaction.id !== reactionId)
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error'
      } finally {
        this.loading = false
      }
    },
  },
})
