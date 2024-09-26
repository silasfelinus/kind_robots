import { defineStore } from 'pinia'
import type {
  Reaction,
  Channel,
  ReactionType,
  ReactionCategory,
} from '@prisma/client'

export const useReactionStore = defineStore('reactionStore', {
  state: () => ({
    reactions: [] as Reaction[],
    loading: false,
    error: null as string | null,
    channels: [] as Channel[], // Store channels related to reactions
  }),

  getters: {
    // Get reactions filtered by the componentId
    getReactionsByComponentId: (state) => (componentId: number) =>
      state.reactions.filter(
        (reaction: Reaction) => reaction.componentId === componentId,
      ),

    // Find a user reaction for a specific component
    getUserReactionForComponent:
      (state) => (componentId: number, userId: number) =>
        state.reactions.find(
          (reaction: Reaction) =>
            reaction.componentId === componentId && reaction.userId === userId,
        ),

    // Fetch the channels related to a component's reactions
    getChannelsForComponent: (state) => (componentId: number) =>
      state.channels.filter((channel: Channel) =>
        state.reactions.some(
          (reaction: Reaction) =>
            reaction.componentId === componentId &&
            reaction.channelId === channel.id,
        ),
      ),
  },

  actions: {
    // Fetch all reactions for a specific pitch through the API
    async fetchReactionsForPitch(pitchId: number) {
      this.loading = true
      this.error = null
      try {
        const response = await fetch(`/api/reactions/pitch/${pitchId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (!response.ok) throw new Error('Failed to fetch reactions')
        const data = await response.json()

        // Assuming data.reactions is an array of Reaction
        this.reactions = data.reactions
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : 'Failed to fetch reactions'
      } finally {
        this.loading = false
      }
    },

    // Find the user's reaction to a specific pitch through the API
    async findUserReactionForPitch(pitchId: number, userId: number) {
      try {
        const response = await fetch(
          `/api/reactions/user/${userId}/pitch/${pitchId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        )
        if (!response.ok) throw new Error('Failed to find user reaction')
        const reaction: Reaction = await response.json()
        return reaction
      } catch (error) {
        console.error('Error finding user reaction:', error)
        throw error
      }
    },
    // Create a new reaction
    async createReaction(reactionData: {
      pitchId?: number | null
      userId: number
      reactionType: ReactionType
      artId?: number
      componentId?: number
      channelId?: number
      chatExchangeId?: number
      comment?: string
      reactionCategory?: ReactionCategory
    }) {
      // Ensure userId is valid
      if (!reactionData.userId) {
        throw new Error('userId is required')
      }

      try {
        const response = await fetch('/api/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reactionData),
        })
        if (!response.ok) throw new Error('Failed to create reaction')
        const newReaction: Reaction = await response.json()
        this.reactions.push(newReaction)
        return newReaction
      } catch (error) {
        console.error('Error creating reaction:', error)
        throw error
      }
    },

    async updateReaction(
      reactionId: number,
      updates: { reactionType?: ReactionType; pitchId?: number | null },
    ) {
      try {
        const processedUpdates = {
          ...updates,
          pitchId: updates.pitchId ?? undefined, // Convert null to undefined
        }

        const response = await fetch(`/api/reactions/${reactionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(processedUpdates),
        })
        if (!response.ok) throw new Error('Failed to update reaction')
        const updatedReaction: Reaction = await response.json()
        const index = this.reactions.findIndex((r) => r.id === reactionId)
        if (index !== -1) {
          this.reactions[index] = updatedReaction
        }
        return updatedReaction
      } catch (error) {
        console.error('Error updating reaction:', error)
        throw error
      }
    },

    // Get reaction by chatExchangeId
    getReactionByChatExchangeId(chatExchangeId: number) {
      return this.reactions.find(
        (reaction: Reaction) => reaction.chatExchangeId === chatExchangeId,
      )
    },

    // Fetch reactions by componentId
    async fetchReactionsByComponentId(componentId: number) {
      this.loading = true
      this.error = null
      try {
        const res = await fetch(`/api/components/${componentId}/reactions`)
        const data = await res.json()
        if (data.success) {
          this.reactions = data.reactions
        } else {
          throw new Error('Failed to fetch reactions')
        }
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : 'Failed to fetch reactions'
      } finally {
        this.loading = false
      }
    },

    // Fetch reactions by artId
    async fetchReactionsByArtId(artId: number) {
      this.loading = true
      this.error = null
      try {
        const response = await fetch(`/api/reactions/art/${artId}`)
        const data = await response.json()
        if (!response.ok) throw new Error('Failed to fetch reactions')
        this.reactions = data.reactions
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : 'Failed to fetch reactions'
      } finally {
        this.loading = false
      }
    },

    // Create reaction and associate it with a new channel
    async createReactionWithChannel(
      reactionData: {
        userId: number
        reactionType: ReactionType
        pitchId?: number
        artId?: number
        componentId?: number
        channelId?: number
        chatExchangeId?: number
        comment?: string
        ReactionCategory?: ReactionCategory
      },
      comment: { title: string; description: string },
    ) {
      this.loading = true
      this.error = null
      try {
        // Create a new channel for the reaction
        const channelResponse = await fetch('/api/channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: `Reaction-Component-${Date.now()}`,
            title: comment.title,
            description: comment.description,
          }),
        })
        if (!channelResponse.ok) throw new Error('Failed to create channel')
        const newChannel: Channel = await channelResponse.json()

        // Create the reaction and link it to the new channel
        const reactionResponse = await fetch('/api/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...reactionData, channelId: newChannel.id }),
        })
        if (!reactionResponse.ok) throw new Error('Failed to create reaction')
        const newReaction: Reaction = await reactionResponse.json()

        // Update the store with the new reaction and channel
        this.reactions.push(newReaction)
        this.channels.push(newChannel)
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : 'Failed to create reaction with channel'
      } finally {
        this.loading = false
      }
    },

    // Fetch channels associated with a component's reactions
    async fetchChannelsByComponentId(componentId: number) {
      this.loading = true
      this.error = null
      try {
        const response = await fetch(`/api/channels/component/${componentId}`)
        const data = await response.json()
        if (data.success) {
          this.channels = data.channels
        } else {
          throw new Error('Failed to fetch channels')
        }
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : 'Failed to fetch channels'
      } finally {
        this.loading = false
      }
    },

    // Delete a reaction
    async deleteReaction(reactionId: number) {
      this.loading = true
      this.error = null
      try {
        const response = await fetch(`/api/reactions/${reactionId}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error('Failed to delete reaction')
        this.reactions = this.reactions.filter(
          (reaction: Reaction) => reaction.id !== reactionId,
        )
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : 'Unknown error occurred'
      } finally {
        this.loading = false
      }
    },
  },
})
