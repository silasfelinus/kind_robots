import { defineStore } from 'pinia'
import type { Reaction, Channel, ReactionType, ReactionCategory } from '@prisma/client'

export enum ReactionTypeEnum {
  LOVED = 'LOVED',
  CLAPPED = 'CLAPPED',
  BOOED = 'BOOED',
  HATED = 'HATED',
  NEUTRAL = 'NEUTRAL',
  FLAGGED = 'FLAGGED',
}

export enum ReactionCategoryEnum {
  ART = 'ART',
  PITCH = 'PITCH',
  COMPONENT = 'COMPONENT',
  CHANNEL = 'CHANNEL',
  TITLE = 'TITLE',
}

export const useReactionStore = defineStore('reactionStore', {
  state: () => ({
    reactions: [] as Reaction[],
    loading: false,
    error: null as string | null,
    channels: [] as Channel[], // Store channels related to reactions
    isInitialized: false,
  }),

  getters: {
    getReactionsByComponentId: (state) => (componentId: number) => {
      console.log(`Getting reactions for componentId: ${componentId}`)
      return state.reactions.filter(
        (reaction: Reaction) => reaction.componentId === componentId,
      )
    },

    getUserReactionForComponent: (state) => (componentId: number, userId: number) => {
      console.log(`Getting user reaction for componentId: ${componentId}, userId: ${userId}`)
      return state.reactions.find(
        (reaction: Reaction) =>
          reaction.componentId === componentId && reaction.userId === userId,
      )
    },

    getChannelsForComponent: (state) => (componentId: number) => {
      console.log(`Getting channels for componentId: ${componentId}`)
      return state.channels.filter((channel: Channel) =>
        state.reactions.some(
          (reaction: Reaction) =>
            reaction.componentId === componentId &&
            reaction.channelId === channel.id,
        ),
      )
    },
  },

  actions: {
    async initializeReactions() {
      console.log('Initializing reactions...')
      if (!this.isInitialized) {
        await this.fetchReactions()
        this.isInitialized = true
      }
      console.log('Initialization complete')
    },
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
        reactionCategory?: ReactionCategory
      },
      comment: { title: string; description: string },
    ) {
      console.log('Creating reaction with channel', reactionData, comment)
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
        console.log('Created new reaction and channel:', newReaction, newChannel)
      } catch (error) {
        console.error('Error creating reaction with channel:', error)
        this.error =
          error instanceof Error
            ? error.message
            : 'Failed to create reaction with channel'
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
      // Get reaction by chatExchangeId
    getReactionByChatExchangeId(chatExchangeId: number) {
      return this.reactions.find(
        (reaction: Reaction) => reaction.chatExchangeId === chatExchangeId,
      )
    },    
    async fetchReactionsByComponentId(componentId: number) {
      console.log(`Fetching reactions for componentId: ${componentId}`)
      this.loading = true
      this.error = null
      try {
        const response = await fetch(`/api/components/${componentId}/reactions`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        const data = await response.json()
        if (data.success) {
          this.reactions = data.reactions
          console.log('Fetched reactions:', this.reactions)
        } else {
          throw new Error('Failed to fetch reactions')
        }
      } catch (error) {
        console.error('Error fetching reactions by componentId:', error)
        this.error = error instanceof Error ? error.message : 'Failed to fetch reactions'
      } finally {
        this.loading = false
      }
    },
    async fetchReactions() {
      console.log('Fetching all reactions')
      this.loading = true
      this.error = null
      try {
        const response = await fetch('/api/reactions', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (!response.ok) {
          console.error('Error response from fetchReactions:', response)
          throw new Error('Failed to fetch reactions')
        }
        const data = await response.json()
        this.reactions = data.reactions
        console.log('Fetched reactions:', this.reactions)
      } catch (error) {
        console.error('Error fetching reactions:', error)
        this.error = error instanceof Error ? error.message : 'Failed to fetch reactions'
      } finally {
        this.loading = false
      }
    },

    async fetchReactionsForPitch(pitchId: number) {
      console.log(`Fetching reactions for pitchId: ${pitchId}`)
      this.loading = true
      this.error = null
      try {
        const response = await fetch(`/api/reactions/pitch/${pitchId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (!response.ok) {
          console.error('Error response from fetchReactionsForPitch:', response)
          throw new Error('Failed to fetch reactions')
        }
        const data = await response.json()
        this.reactions = data.reactions
        console.log('Fetched reactions:', this.reactions)
      } catch (error) {
        console.error('Error fetching reactions for pitch:', error)
        this.error = error instanceof Error ? error.message : 'Failed to fetch reactions'
      } finally {
        this.loading = false
        console.log('Finished fetching reactions for pitchId:', pitchId)
      }
    },

    async findUserReactionForPitch(pitchId: number, userId: number) {
      console.log(`Finding user reaction for pitchId: ${pitchId}, userId: ${userId}`)
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
        if (!response.ok) {
          console.error('Error response from findUserReactionForPitch:', response)
          throw new Error('Failed to find user reaction')
        }
        const reaction: Reaction = await response.json()
        console.log('Found user reaction:', reaction)
        return reaction
      } catch (error) {
        console.error('Error finding user reaction:', error)
        throw error
      }
    },

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
      console.log('Creating reaction with data:', reactionData)

      if (!reactionData.userId) {
        console.error('Missing userId in reactionData')
        throw new Error('userId is required')
      }

      try {
        const response = await fetch('/api/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reactionData),
        })
        if (!response.ok) {
          console.error('Error response from createReaction:', response)
          throw new Error('Failed to create reaction')
        }
        const newReaction: Reaction = await response.json()
        this.reactions.push(newReaction)
        console.log('Created new reaction:', newReaction)
        return newReaction
      } catch (error) {
        console.error('Error creating reaction:', error)
        throw error
      }
    },
    async updateReaction(reactionId: number, updates: { reactionType?: ReactionTypeEnum }) {
      console.log('Updating reaction with reactionId:', reactionId, 'and updates:', updates)
    
      try {
        const response = await fetch(`/api/reactions/${reactionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        if (!response.ok) {
          console.error('Error response from updateReaction:', response)
          throw new Error('Failed to update reaction')
        }
        const updatedReaction: Reaction = await response.json()
        const index = this.reactions.findIndex((r) => r.id === reactionId)
        if (index !== -1) {
          this.reactions[index] = updatedReaction
        }
        console.log('Updated reaction:', updatedReaction)
        return updatedReaction
      } catch (error) {
        console.error('Error updating reaction:', error)
        throw error
      }
    },
    

    async deleteReaction(reactionId: number) {
      console.log('Deleting reaction with reactionId:', reactionId)
      this.loading = true
      this.error = null
      try {
        const response = await fetch(`/api/reactions/${reactionId}`, {
          method: 'DELETE',
        })
        if (!response.ok) {
          console.error('Error response from deleteReaction:', response)
          throw new Error('Failed to delete reaction')
        }
        this.reactions = this.reactions.filter((reaction: Reaction) => reaction.id !== reactionId)
        console.log('Deleted reaction, remaining reactions:', this.reactions)
      } catch (error) {
        console.error('Error deleting reaction:', error)
        this.error = error instanceof Error ? error.message : 'Unknown error occurred'
      } finally {
        this.loading = false
      }
    },
  },
})

export type { Reaction, ReactionType, ReactionCategory }
