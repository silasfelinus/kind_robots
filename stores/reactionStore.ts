import { defineStore } from 'pinia'
import type { Reaction } from '@prisma/client'

export const useReactionStore = defineStore('reactionStore', {
  state: () => ({
    reactions: [] as Reaction[],
    loading: false,
    error: null as string | null,
    channels: [] as Channel[], // Store channels related to reactions
  }),

  getters: {
    getReactionsByComponentId: (state) => (componentId: number) =>
      state.reactions.filter(
        (reaction) => reaction.componentId === componentId,
      ),

    getUserReactionForComponent:
      (state) => (componentId: number, userId: number) =>
        state.reactions.find(
          (reaction) =>
            reaction.componentId === componentId && reaction.userId === userId,
        ),

    // Fetch channels with comments for the specific component
    getChannelsForComponent: (state) => (componentId: number) =>
      state.channels.filter((channel) =>
        state.reactions.some(
          (reaction) =>
            reaction.componentId === componentId &&
            reaction.channelId === channel.id,
        ),
      ),
  },

  actions: {
    async fetchReactionsByComponentId(componentId: number) {
      this.loading = true
      try {
        const response = await fetch(`/api/reactions/component/${componentId}`)
        const data = await response.json()
        this.reactions = data.reactions
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : 'Failed to fetch reactions'
      } finally {
        this.loading = false
      }
    },

    // Create a comment channel when a user adds a comment to a reaction
    async createReactionWithChannel(
      reactionData: Partial<Reaction>,
      comment: { title: string; description: string },
    ) {
      try {
        // Create the channel first
        const channelResponse = await fetch('/api/channels', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            label: `Reaction-Component-${Date.now()}`,
            title: comment.title,
            description: comment.description,
          }),
        })

        const newChannel = await channelResponse.json()

        // Create the reaction with the new channelId
        const reactionResponse = await fetch('/api/reactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...reactionData,
            channelId: newChannel.id,
          }),
        })

        const newReaction = await reactionResponse.json()
        this.reactions.push(newReaction)
        this.channels.push(newChannel)
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : 'Failed to create reaction with channel'
      }
    },

    // Fetch the channels for a specific component
    async fetchChannelsByComponentId(componentId: number) {
      try {
        const response = await fetch(`/api/channels/component/${componentId}`)
        const data = await response.json()
        this.channels = data.channels
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : 'Failed to fetch channels'
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
        const index = this.reactions.findIndex((r) => r.id === reactionId)
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
        this.reactions = this.reactions.filter(
          (reaction) => reaction.id !== reactionId,
        )
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error'
      } finally {
        this.loading = false
      }
    },
  },
})
