import { defineStore } from 'pinia'
import type {
  Reaction,
  Channel,
  ReactionType,
  ReactionCategory,
} from '@prisma/client'
import { performFetch, handleError } from './utils'

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
    channels: [] as Channel[],
    isInitialized: false,
  }),

  getters: {
    getReactionsByComponentId: (state) => (componentId: number) => {
      return state.reactions.filter(
        (reaction: Reaction) => reaction.componentId === componentId,
      )
    },
    getUserReactionForComponent:
      (state) => (componentId: number, userId: number) => {
        return state.reactions.find(
          (reaction: Reaction) =>
            reaction.componentId === componentId && reaction.userId === userId,
        )
      },
    getChannelsForComponent: (state) => (componentId: number) => {
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
      if (!this.isInitialized) {
        await this.fetchReactions()
        this.isInitialized = true
      }
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
      this.loading = true
      this.error = null
      try {
        const channelResponse = await performFetch<{ channel: Channel }>(
          '/api/channels',
          {
            method: 'POST',
            body: JSON.stringify({
              label: `Reaction-Component-${Date.now()}`,
              title: comment.title,
              description: comment.description,
            }),
          },
        )

        if (!channelResponse.success) throw new Error(channelResponse.message)
        const newChannel = channelResponse.data?.channel

        const reactionResponse = await performFetch<{ reaction: Reaction }>(
          '/api/reactions',
          {
            method: 'POST',
            body: JSON.stringify({
              ...reactionData,
              channelId: newChannel?.id,
            }),
          },
        )

        if (!reactionResponse.success) throw new Error(reactionResponse.message)
        const newReaction = reactionResponse.data?.reaction

        if (newReaction) this.reactions.push(newReaction)
        if (newChannel) this.channels.push(newChannel)
      } catch (error) {
        handleError(error, 'creating reaction with channel')
      } finally {
        this.loading = false
      }
    },

    async fetchReactionsByArtId(artId: number) {
      this.loading = true
      this.error = null
      try {
        const response = await performFetch<{ reactions: Reaction[] }>(
          `/api/reactions/art/${artId}`,
        )
        if (!response.success) throw new Error(response.message)
        this.reactions = [
          ...this.reactions,
          ...(response.data?.reactions || []),
        ]
      } catch (error) {
        handleError(error, 'fetching reactions by art ID')
      } finally {
        this.loading = false
      }
    },

    async fetchReactionsByComponentId(componentId: number) {
      this.loading = true
      this.error = null
      try {
        const response = await performFetch<{ reactions: Reaction[] }>(
          `/api/components/${componentId}/reactions`,
        )
        if (!response.success) throw new Error(response.message)
        this.reactions = response.data?.reactions || []
      } catch (error) {
        handleError(error, 'fetching reactions by component ID')
      } finally {
        this.loading = false
      }
    },

    async fetchReactions() {
      this.loading = true
      this.error = null
      try {
        const response = await performFetch<{ reactions: Reaction[] }>(
          '/api/reactions',
        )
        if (!response.success) throw new Error(response.message)
        this.reactions = response.data?.reactions || []
      } catch (error) {
        handleError(error, 'fetching all reactions')
      } finally {
        this.loading = false
      }
    },

    async addReaction({
      userId,
      reactionType,
      rating,
      comment = '',
      artId = null,
      artImageId = null,
      pitchId = null,
      componentId = null,
      channelId = null,
      chatExchangeId = null,
      botId = null,
      galleryId = null,
      messageId = null,
      postId = null,
      promptId = null,
      resourceId = null,
      rewardId = null,
      tagId = null,
      reactionCategory = ReactionCategoryEnum.COMPONENT,
    }: {
      userId: number
      reactionType: ReactionTypeEnum
      rating: number
      comment?: string
      artId?: number | null
      artImageId?: number | null
      pitchId?: number | null
      componentId?: number | null
      channelId?: number | null
      chatExchangeId?: number | null
      botId?: number | null
      galleryId?: number | null
      messageId?: number | null
      postId?: number | null
      promptId?: number | null
      resourceId?: number | null
      rewardId?: number | null
      tagId?: number | null
      reactionCategory?: ReactionCategoryEnum
    }) {
      try {
        const response = await performFetch<{ reaction: Reaction }>(
          '/api/reactions',
          {
            method: 'POST',
            body: JSON.stringify({
              userId,
              reactionType,
              rating,
              comment,
              artId,
              artImageId,
              pitchId,
              componentId,
              channelId,
              chatExchangeId,
              botId,
              galleryId,
              messageId,
              postId,
              promptId,
              resourceId,
              reactionCategory,
              rewardId,
              tagId,
            }),
          },
        )
        if (!response.success) throw new Error(response.message)
        const newReaction = response.data?.reaction
        if (newReaction) this.reactions.push(newReaction)
        return newReaction
      } catch (error) {
        handleError(error, 'adding reaction')
        throw error
      }
    },

    async updateReaction(
      reactionId: number,
      updates: {
        reactionType?: ReactionTypeEnum
        rating?: number
        comment?: string
      },
    ) {
      try {
        const response = await performFetch<{ reaction: Reaction }>(
          `/api/reactions/${reactionId}`,
          {
            method: 'PATCH',
            body: JSON.stringify(updates),
          },
        )
        if (!response.success) throw new Error(response.message)
        const updatedReaction = response.data?.reaction
        const index = this.reactions.findIndex((r) => r.id === reactionId)
        if (index !== -1 && updatedReaction)
          this.reactions[index] = updatedReaction
        return updatedReaction
      } catch (error) {
        handleError(error, 'updating reaction')
        throw error
      }
    },

    async deleteReaction(reactionId: number) {
      this.loading = true
      this.error = null
      try {
        const response = await performFetch(`/api/reactions/${reactionId}`, {
          method: 'DELETE',
        })
        if (!response.success) throw new Error(response.message)
        this.reactions = this.reactions.filter(
          (reaction: Reaction) => reaction.id !== reactionId,
        )
      } catch (error) {
        handleError(error, 'deleting reaction')
      } finally {
        this.loading = false
      }
    },
  },
})

export type { Reaction, ReactionType, ReactionCategory }
