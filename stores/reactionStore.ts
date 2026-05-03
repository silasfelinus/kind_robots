// /stores/reactionStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Reaction,
  ReactionType,
  ReactionCategory,
} from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from './utils'
import PitchManager from '~/abandonware/pitches/pitch-manager.vue'

export type ReactionTypeEnum = `${ReactionType}`
export type ReactionCategoryEnum = `${ReactionCategory}`

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
  'ART_IMAGE',
  'PITCH',
  'COMPONENT',
  'CHAT_EXCHANGE',
  'DREAM',
  'BOT',
  'GALLERY',
  'MESSAGE',
  'POST',
  'PROMPT',
  'RESOURCE',
  'REWARD',
  'TAG',
]

type ReactionFetchKey = `art:${number}` | `component:${number}`

export type ReactionTargetType =
  | 'art'
  | 'artImage'
  | 'bot'
  | 'chat'
  | 'component'
  | 'dream'
  | 'gallery'
  | 'message'
  | 'pitch'
  | 'post'
  | 'prompt'
  | 'resource'
  | 'reward'
  | 'tag'

type AddReactionPayload = {
  userId: number
  reactionType: ReactionTypeEnum
  rating: number
  comment?: string
  reactionCategory?: ReactionCategoryEnum
  artId?: number | null
  artImageId?: number | null
  pitchId?: number | null
  componentId?: number | null
  chatId?: number | null
  dreamId?: number | null
  botId?: number | null
  galleryId?: number | null
  messageId?: number | null
  postId?: number | null
  promptId?: number | null
  resourceId?: number | null
  rewardId?: number | null
  tagId?: number | null
}

type UpdateReactionPayload = {
  reactionType?: ReactionTypeEnum
  rating?: number
  comment?: string
}

export const useReactionStore = defineStore('reactionStore', () => {
  const reactions = ref<Reaction[]>([])
  const isInitialized = ref(false)
  const isInitializing = ref(false)
  const lastError = ref<string | null>(null)

  const initializePromise = ref<Promise<void> | null>(null)
  const loadingMap = ref<Record<string, boolean>>({})
  const fetchPromises = ref<Record<string, Promise<Reaction[]>>>({})
  const loadedKeys = ref<Set<string>>(new Set())

  const getReactionsByComponentId = computed(() => (componentId: number) => {
    return reactions.value.filter(
      (reaction) => reaction.componentId === componentId,
    )
  })

  const getReactionsByArtId = computed(() => (artId: number) => {
    return reactions.value.filter((reaction) => reaction.artId === artId)
  })

  const getUserReactionForComponent = computed(
    () => (componentId: number, userId: number) => {
      return reactions.value.find(
        (reaction) =>
          reaction.componentId === componentId && reaction.userId === userId,
      )
    },
  )

  const getUserReactionForArt = computed(
    () => (artId: number, userId: number) => {
      return reactions.value.find(
        (reaction) => reaction.artId === artId && reaction.userId === userId,
      )
    },
  )

  function getKey(type: 'art' | 'component', id: number): ReactionFetchKey {
    return `${type}:${id}`
  }

  function setLoading(key: string, value: boolean) {
    loadingMap.value[key] = value
  }

  function setLastError(error: unknown, fallback: string) {
    lastError.value = error instanceof Error ? error.message : fallback
  }

  function clearError() {
    lastError.value = null
  }

  function upsertReaction(reaction: Reaction) {
    const index = reactions.value.findIndex((entry) => entry.id === reaction.id)

    if (index >= 0) {
      reactions.value.splice(index, 1, reaction)
    } else {
      reactions.value.push(reaction)
    }
  }

  function mergeReactions(incoming: Reaction[]) {
    for (const reaction of incoming) {
      upsertReaction(reaction)
    }
  }

  function removeReactionLocally(reactionId: number) {
    reactions.value = reactions.value.filter(
      (reaction) => reaction.id !== reactionId,
    )
  }

  async function initialize(force = false): Promise<void> {
    if (isInitialized.value && !force) return
    if (initializePromise.value && !force) return initializePromise.value

    initializePromise.value = (async () => {
      try {
        isInitializing.value = true
        clearError()
        isInitialized.value = true
      } catch (error) {
        isInitialized.value = false
        handleError(error, 'initializing reaction store')
        setLastError(error, 'Failed to initialize reaction store')
      } finally {
        isInitializing.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function fetchReactionsByArtId(
    artId: number,
    force = false,
  ): Promise<Reaction[]> {
    const key = getKey('art', artId)

    if (!force && loadedKeys.value.has(key)) {
      return getReactionsByArtId.value(artId)
    }

    if (fetchPromises.value[key] && !force) {
      return fetchPromises.value[key]
    }

    fetchPromises.value[key] = (async () => {
      setLoading(key, true)

      try {
        clearError()

        const res = await performFetch<Reaction[]>(
          `/api/reactions/art/${artId}`,
        )

        if (!res.success) {
          throw new Error(res.message || 'Failed to fetch art reactions')
        }

        const incoming = res.data || []
        mergeReactions(incoming)
        loadedKeys.value.add(key)

        return getReactionsByArtId.value(artId)
      } catch (error) {
        handleError(error, 'fetching reactions by art ID')
        setLastError(error, 'Failed to fetch art reactions')
        return getReactionsByArtId.value(artId)
      } finally {
        setLoading(key, false)
        delete fetchPromises.value[key]
      }
    })()

    return fetchPromises.value[key]
  }

  async function fetchReactionsByComponentId(
    componentId: number,
    force = false,
  ): Promise<Reaction[]> {
    const key = getKey('component', componentId)

    if (!force && loadedKeys.value.has(key)) {
      return getReactionsByComponentId.value(componentId)
    }

    if (fetchPromises.value[key] && !force) {
      return fetchPromises.value[key]
    }

    fetchPromises.value[key] = (async () => {
      setLoading(key, true)

      try {
        clearError()

        const res = await performFetch<Reaction[]>(
          `/api/reactions/component/${componentId}`,
        )

        if (!res.success) {
          throw new Error(res.message || 'Failed to fetch component reactions')
        }

        const incoming = res.data || []
        mergeReactions(incoming)
        loadedKeys.value.add(key)

        return getReactionsByComponentId.value(componentId)
      } catch (error) {
        handleError(error, 'fetching reactions by component ID')
        setLastError(error, 'Failed to fetch component reactions')
        return getReactionsByComponentId.value(componentId)
      } finally {
        setLoading(key, false)
        delete fetchPromises.value[key]
      }
    })()

    return fetchPromises.value[key]
  }

  async function addReaction(payload: AddReactionPayload) {
    try {
      clearError()

      const res = await performFetch<Reaction>('/api/reactions', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to add reaction')
      }

      upsertReaction(res.data)

      if (payload.artId) {
        loadedKeys.value.delete(getKey('art', payload.artId))
      }

      if (payload.componentId) {
        loadedKeys.value.delete(getKey('component', payload.componentId))
      }

      return res.data
    } catch (error) {
      handleError(error, 'adding reaction')
      setLastError(error, 'Failed to add reaction')
      return null
    }
  }

  async function updateReaction(
    reactionId: number,
    updates: UpdateReactionPayload,
  ) {
    try {
      clearError()

      const res = await performFetch<Reaction>(`/api/reactions/${reactionId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to update reaction')
      }

      upsertReaction(res.data)
      return res.data
    } catch (error) {
      handleError(error, 'updating reaction')
      setLastError(error, 'Failed to update reaction')
      return null
    }
  }

  async function deleteReaction(reactionId: number) {
    const existing = reactions.value.find(
      (reaction) => reaction.id === reactionId,
    )

    try {
      clearError()

      const res = await performFetch(`/api/reactions/${reactionId}`, {
        method: 'DELETE',
      })

      if (!res.success) {
        throw new Error(res.message || 'Failed to delete reaction')
      }

      removeReactionLocally(reactionId)

      if (existing?.artId) {
        loadedKeys.value.delete(getKey('art', existing.artId))
      }

      if (existing?.componentId) {
        loadedKeys.value.delete(getKey('component', existing.componentId))
      }

      return true
    } catch (error) {
      handleError(error, 'deleting reaction')
      setLastError(error, 'Failed to delete reaction')
      return false
    }
  }

  function resetReactionsForKey(type: 'art' | 'component', id: number) {
    const key = getKey(type, id)
    loadedKeys.value.delete(key)
    delete fetchPromises.value[key]

    if (type === 'art') {
      reactions.value = reactions.value.filter(
        (reaction) => reaction.artId !== id,
      )
      return
    }

    reactions.value = reactions.value.filter(
      (reaction) => reaction.componentId !== id,
    )
  }

  function resetInitialization() {
    isInitialized.value = false
    isInitializing.value = false
    initializePromise.value = null
    fetchPromises.value = {}
    loadedKeys.value = new Set()
    loadingMap.value = {}
    lastError.value = null
  }

  return {
    reactions,
    isInitialized,
    isInitializing,
    lastError,
    initializePromise,
    loadingMap,
    fetchPromises,
    loadedKeys,

    reactionTypes,
    reactionCategories,

    getReactionsByComponentId,
    getReactionsByArtId,
    getUserReactionForComponent,
    getUserReactionForArt,

    initialize,
    resetInitialization,
    resetReactionsForKey,
    fetchReactionsByArtId,
    fetchReactionsByComponentId,
    addReaction,
    updateReaction,
    deleteReaction,
  }
})

export type { Reaction, ReactionType, ReactionCategory }
