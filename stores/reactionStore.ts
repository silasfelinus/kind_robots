import { defineStore } from 'pinia'
import type { Reaction, ReactionType, ReactionCategory } from '@prisma/client'
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
  TITLE = 'TITLE',
}

export const useReactionStore = defineStore('reactionStore', {
  state: () => ({
    reactions: [] as Reaction[],
    loading: false,
    error: null as string | null,
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
  },

  actions: {
    async initializeReactions() {
      if (!this.isInitialized) {
        await this.fetchReactions()
        this.isInitialized = true
      }
    },
    async fetchReactionsByArtId(artId: number) {
      this.loading = true
      this.error = null
      try {
        const response = await performFetch<Reaction[]>(
          `/api/reactions/art/${artId}`,
        )
        if (!response.success) throw new Error(response.message)
        this.reactions = [...this.reactions, ...(response.data || [])]
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
        const response = await performFetch<Reaction[]>(
          `/api/reactions/component/${componentId}`,
        )
        if (!response.success) throw new Error(response.message)
        this.reactions = response.data || []
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
        const response = await performFetch<Reaction[]>('/api/reactions')
        if (!response.success) throw new Error(response.message)
        this.reactions = response.data || []
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
      chatId = null,
      botId = null,
      galleryId = null,
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
      chatId?: number | null
      botId?: number | null
      galleryId?: number | null
      promptId?: number | null
      resourceId?: number | null
      rewardId?: number | null
      tagId?: number | null
      reactionCategory?: ReactionCategoryEnum
    }) {
      try {
        const response = await performFetch<Reaction>('/api/reactions', {
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
            chatId,
            botId,
            galleryId,
            promptId,
            resourceId,
            reactionCategory,
            rewardId,
            tagId,
          }),
        })
        if (!response.success) throw new Error(response.message)
        const newReaction = response.data
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
        const response = await performFetch<Reaction>(
          `/api/reactions/${reactionId}`,
          {
            method: 'PATCH',
            body: JSON.stringify(updates),
          },
        )
        if (!response.success) throw new Error(response.message)
        const updatedReaction = response.data
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
