// /stores/reactionStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Reaction, ReactionType, ReactionCategory } from '@prisma/client'
import { performFetch, handleError } from './utils'

export type ReactionTypeEnum =
  | 'LOVED'
  | 'CLAPPED'
  | 'BOOED'
  | 'HATED'
  | 'NEUTRAL'
  | 'FLAGGED'

export type ReactionCategoryEnum = 'ART' | 'PITCH' | 'COMPONENT' | 'TITLE'

export const reactionTypes: ReactionTypeEnum[] = [
  'LOVED',
  'CLAPPED',
  'BOOED',
  'HATED',
  'NEUTRAL',
  'FLAGGED',
]

export const reactionCategories: ReactionCategoryEnum[] = [
  'ART',
  'PITCH',
  'COMPONENT',
  'TITLE',
]

export const useReactionStore = defineStore('reactionStore', () => {
  const reactions = ref<Reaction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)

  const getReactionsByComponentId = computed(() => (componentId: number) => {
    return reactions.value.filter(
      (r: { componentId: number }) => r.componentId === componentId,
    )
  })

  const getUserReactionForComponent = computed(
    () => (componentId: number, userId: number) => {
      return reactions.value.find(
        (r: { componentId: number; userId: number }) =>
          r.componentId === componentId && r.userId === userId,
      )
    },
  )

  async function initialize() {
    if (!isInitialized.value) {
      await fetchReactions()
      isInitialized.value = true
    }
  }

  async function fetchReactions() {
    loading.value = true
    error.value = null
    try {
      const res = await performFetch<Reaction[]>('/api/reactions')
      if (!res.success) throw new Error(res.message)
      reactions.value = res.data || []
    } catch (e) {
      handleError(e, 'fetching all reactions')
    } finally {
      loading.value = false
    }
  }

  async function fetchReactionsByArtId(artId: number) {
    loading.value = true
    error.value = null
    try {
      const res = await performFetch<Reaction[]>(`/api/reactions/art/${artId}`)
      if (!res.success) throw new Error(res.message)
      reactions.value = [...reactions.value, ...(res.data || [])]
    } catch (e) {
      handleError(e, 'fetching reactions by art ID')
    } finally {
      loading.value = false
    }
  }

  async function fetchReactionsByComponentId(componentId: number) {
    loading.value = true
    error.value = null
    try {
      const res = await performFetch<Reaction[]>(
        `/api/reactions/component/${componentId}`,
      )
      if (!res.success) throw new Error(res.message)
      reactions.value = res.data || []
    } catch (e) {
      handleError(e, 'fetching reactions by component ID')
    } finally {
      loading.value = false
    }
  }

  async function addReaction(payload: {
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
      const res = await performFetch<Reaction>('/api/reactions', {
        method: 'POST',
        body: JSON.stringify({ ...payload }),
      })
      if (!res.success) throw new Error(res.message)
      if (res.data) reactions.value.push(res.data)
      return res.data
    } catch (e) {
      handleError(e, 'adding reaction')
      throw e
    }
  }

  async function updateReaction(
    reactionId: number,
    updates: {
      reactionType?: ReactionTypeEnum
      rating?: number
      comment?: string
    },
  ) {
    try {
      const res = await performFetch<Reaction>(`/api/reactions/${reactionId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      if (!res.success) throw new Error(res.message)
      const index = reactions.value.findIndex(
        (r: { id: number }) => r.id === reactionId,
      )
      if (index !== -1 && res.data) reactions.value[index] = res.data
      return res.data
    } catch (e) {
      handleError(e, 'updating reaction')
      throw e
    }
  }

  async function deleteReaction(reactionId: number) {
    loading.value = true
    error.value = null
    try {
      const res = await performFetch(`/api/reactions/${reactionId}`, {
        method: 'DELETE',
      })
      if (!res.success) throw new Error(res.message)
      reactions.value = reactions.value.filter(
        (r: { id: number }) => r.id !== reactionId,
      )
    } catch (e) {
      handleError(e, 'deleting reaction')
    } finally {
      loading.value = false
    }
  }

  return {
    reactions,
    loading,
    error,
    isInitialized,
    getReactionsByComponentId,
    getUserReactionForComponent,
    initialize,
    fetchReactions,
    fetchReactionsByArtId,
    fetchReactionsByComponentId,
    addReaction,
    updateReaction,
    deleteReaction,
  }
})

export type { Reaction, ReactionType, ReactionCategory }
