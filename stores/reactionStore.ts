// /stores/reactionStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Reaction,
  ReactionType,
  ReactionCategory,
} from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from './utils'

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
  'ART_COLLECTION',
  'BOT',
  'BUTTERFLY',
  'CHARACTER',
  'CHAT_EXCHANGE',
  'COMPONENT',
  'DREAM',
  'MESSAGE',
  'PITCH',
  'POST',
  'PROMPT',
  'RESOURCE',
  'REWARD',
  'SCENARIO',
  'THEME',
]

export type ReactionTargetType =
  | 'artImage'
  | 'artCollection'
  | 'bot'
  | 'butterfly'
  | 'character'
  | 'chat'
  | 'component'
  | 'dream'
  | 'pitch'
  | 'prompt'
  | 'resource'
  | 'reward'
  | 'scenario'
  | 'theme'

type ReactionFetchKey = `${ReactionTargetType}:${number}`

type ReactionTargetIdKey =
  | 'artImageId'
  | 'artCollectionId'
  | 'botId'
  | 'butterflyId'
  | 'characterId'
  | 'chatId'
  | 'componentId'
  | 'dreamId'
  | 'pitchId'
  | 'promptId'
  | 'resourceId'
  | 'rewardId'
  | 'scenarioId'
  | 'themeId'

type AddReactionPayload = {
  userId: number
  reactionType: ReactionTypeEnum
  rating: number
  comment?: string
  reactionCategory?: ReactionCategoryEnum
  artImageId?: number | null
  artCollectionId?: number | null
  botId?: number | null
  butterflyId?: number | null
  characterId?: number | null
  chatId?: number | null
  componentId?: number | null
  dreamId?: number | null
  pitchId?: number | null
  promptId?: number | null
  resourceId?: number | null
  rewardId?: number | null
  scenarioId?: number | null
  themeId?: number | null
}

type UpdateReactionPayload = {
  reactionType?: ReactionTypeEnum
  rating?: number
  comment?: string
}

const targetIdKeyMap: Record<ReactionTargetType, ReactionTargetIdKey> = {
  artImage: 'artImageId',
  artCollection: 'artCollectionId',
  bot: 'botId',
  butterfly: 'butterflyId',
  character: 'characterId',
  chat: 'chatId',
  component: 'componentId',
  dream: 'dreamId',
  pitch: 'pitchId',
  prompt: 'promptId',
  resource: 'resourceId',
  reward: 'rewardId',
  scenario: 'scenarioId',
  theme: 'themeId',
}

export function getReactionTargetPayload(
  targetType: ReactionTargetType,
  targetId: number,
): Partial<AddReactionPayload> {
  return {
    [targetIdKeyMap[targetType]]: targetId,
  }
}

function getReactionTargetId(
  reaction: Reaction,
  targetType: ReactionTargetType,
): number | null {
  const key = targetIdKeyMap[targetType]
  const value = reaction[key]

  return typeof value === 'number' ? value : null
}

function hasReactionTarget(
  reaction: Reaction,
  targetType: ReactionTargetType,
  targetId: number,
): boolean {
  return getReactionTargetId(reaction, targetType) === targetId
}

function getPayloadTargets(payload: AddReactionPayload): ReactionFetchKey[] {
  return Object.entries(targetIdKeyMap)
    .map(([targetType, idKey]) => {
      const value = payload[idKey]

      return typeof value === 'number'
        ? (`${targetType as ReactionTargetType}:${value}` as ReactionFetchKey)
        : null
    })
    .filter((key): key is ReactionFetchKey => Boolean(key))
}

function getReactionTargets(reaction: Reaction): ReactionFetchKey[] {
  return Object.entries(targetIdKeyMap)
    .map(([targetType, idKey]) => {
      const value = reaction[idKey]

      return typeof value === 'number'
        ? (`${targetType as ReactionTargetType}:${value}` as ReactionFetchKey)
        : null
    })
    .filter((key): key is ReactionFetchKey => Boolean(key))
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

  const getReactionsByTarget = computed(() => {
    return (targetType: ReactionTargetType, targetId: number) => {
      return reactions.value.filter((reaction) => {
        return hasReactionTarget(reaction, targetType, targetId)
      })
    }
  })

  const getUserReactionForTarget = computed(() => {
    return (
      targetType: ReactionTargetType,
      targetId: number,
      userId: number,
    ) => {
      return reactions.value.find((reaction) => {
        return (
          reaction.userId === userId &&
          hasReactionTarget(reaction, targetType, targetId)
        )
      })
    }
  })

  const getReactionsByComponentId = computed(() => (componentId: number) => {
    return getReactionsByTarget.value('component', componentId)
  })

  const getReactionsByArtImageId = computed(() => (artImageId: number) => {
    return getReactionsByTarget.value('artImage', artImageId)
  })

  const getUserReactionForComponent = computed(() => {
    return (componentId: number, userId: number) => {
      return getUserReactionForTarget.value('component', componentId, userId)
    }
  })
  const getUserReactionForArtImage = computed(() => {
    return (artImageId: number, userId: number) => {
      return getUserReactionForTarget.value('artImage', artImageId, userId)
    }
  })

  function getKey(type: ReactionTargetType, id: number): ReactionFetchKey {
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
    reactions.value = reactions.value.filter((reaction) => {
      return reaction.id !== reactionId
    })
  }

  function invalidateKey(key: ReactionFetchKey) {
    loadedKeys.value.delete(key)
    delete fetchPromises.value[key]
  }

  function invalidateReactionTargets(reaction: Reaction) {
    for (const key of getReactionTargets(reaction)) {
      invalidateKey(key)
    }
  }

  function invalidatePayloadTargets(payload: AddReactionPayload) {
    for (const key of getPayloadTargets(payload)) {
      invalidateKey(key)
    }
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

  async function fetchReactionsByTarget(
    targetType: ReactionTargetType,
    targetId: number,
    force = false,
  ): Promise<Reaction[]> {
    const key = getKey(targetType, targetId)

    if (!force && loadedKeys.value.has(key)) {
      return getReactionsByTarget.value(targetType, targetId)
    }

    if (fetchPromises.value[key] && !force) {
      return fetchPromises.value[key]
    }

    fetchPromises.value[key] = (async () => {
      setLoading(key, true)

      try {
        clearError()

        const res = await performFetch<Reaction[]>(
          `/api/reactions/${targetType}/${targetId}`,
        )

        if (!res.success) {
          throw new Error(res.message || 'Failed to fetch reactions')
        }

        const incoming = res.data || []
        mergeReactions(incoming)
        loadedKeys.value.add(key)

        return getReactionsByTarget.value(targetType, targetId)
      } catch (error) {
        handleError(error, `fetching reactions for ${targetType}`)
        setLastError(error, 'Failed to fetch reactions')
        return getReactionsByTarget.value(targetType, targetId)
      } finally {
        setLoading(key, false)
        delete fetchPromises.value[key]
      }
    })()

    return fetchPromises.value[key]
  }

  async function fetchReactionsByArtImageId(
    artImageId: number,
    force = false,
  ): Promise<Reaction[]> {
    return fetchReactionsByTarget('artImage', artImageId, force)
  }

  async function fetchReactionsByComponentId(
    componentId: number,
    force = false,
  ): Promise<Reaction[]> {
    return fetchReactionsByTarget('component', componentId, force)
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
      invalidatePayloadTargets(payload)
      invalidateReactionTargets(res.data)

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
    const existing = reactions.value.find((reaction) => {
      return reaction.id === reactionId
    })

    try {
      clearError()

      const res = await performFetch<Reaction>(`/api/reactions/${reactionId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to update reaction')
      }

      if (existing) {
        invalidateReactionTargets(existing)
      }

      upsertReaction(res.data)
      invalidateReactionTargets(res.data)

      return res.data
    } catch (error) {
      handleError(error, 'updating reaction')
      setLastError(error, 'Failed to update reaction')
      return null
    }
  }

  async function deleteReaction(reactionId: number) {
    const existing = reactions.value.find((reaction) => {
      return reaction.id === reactionId
    })

    try {
      clearError()

      const res = await performFetch(`/api/reactions/${reactionId}`, {
        method: 'DELETE',
      })

      if (!res.success) {
        throw new Error(res.message || 'Failed to delete reaction')
      }

      removeReactionLocally(reactionId)

      if (existing) {
        invalidateReactionTargets(existing)
      }

      return true
    } catch (error) {
      handleError(error, 'deleting reaction')
      setLastError(error, 'Failed to delete reaction')
      return false
    }
  }

  function resetReactionsForKey(type: ReactionTargetType, id: number) {
    const key = getKey(type, id)
    loadedKeys.value.delete(key)
    delete fetchPromises.value[key]

    reactions.value = reactions.value.filter((reaction) => {
      return !hasReactionTarget(reaction, type, id)
    })
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

    getReactionsByTarget,
    getUserReactionForTarget,
    getReactionsByComponentId,
    getUserReactionForComponent,

    getReactionsByArtImageId,
    getUserReactionForArtImage,

    initialize,
    resetInitialization,
    resetReactionsForKey,
    fetchReactionsByTarget,
    fetchReactionsByComponentId,
    addReaction,
    updateReaction,
    deleteReaction,
    fetchReactionsByArtImageId,
  }
})

export type { Reaction, ReactionType, ReactionCategory }
