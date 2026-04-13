// /stores/reactionStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Reaction,
  ReactionType,
  ReactionCategory,
} from '~/prisma/generated/prisma/client'
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
  const isInitialized = ref(false)

  const loadingMap = ref<Record<string, boolean>>({})
  const fetchPromises = ref<Record<string, Promise<void> | null>>({})
  const loadedKeys = ref<Set<string>>(new Set())

  function getKey(type: string, id: number) {
    return `${type}:${id}`
  }

  function setLoading(key: string, val: boolean) {
    loadingMap.value[key] = val
  }

  const getReactionsByComponentId = computed(() => (componentId: number) => {
    return reactions.value.filter((r) => r.componentId === componentId)
  })

  const getUserReactionForComponent = computed(
    () => (componentId: number, userId: number) => {
      return reactions.value.find(
        (r) => r.componentId === componentId && r.userId === userId,
      )
    },
  )

  function initialize() {
    if (isInitialized.value) return
    isInitialized.value = true
  }

  async function fetchReactionsByArtId(artId: number, force = false) {
    const key = getKey('art', artId)

    if (!force && loadedKeys.value.has(key)) return
    if (fetchPromises.value[key]) return fetchPromises.value[key]

    fetchPromises.value[key] = (async () => {
      setLoading(key, true)

      try {
        const res = await performFetch<Reaction[]>(
          `/api/reactions/art/${artId}`,
        )
        if (!res.success) throw new Error(res.message)

        const incoming = res.data || []
        const existingIds = new Set(reactions.value.map((r) => r.id))
        const deduped = incoming.filter((r) => !existingIds.has(r.id))

        reactions.value = [...reactions.value, ...deduped]
        loadedKeys.value.add(key)
      } catch (e) {
        handleError(e, 'fetching reactions by art ID')
      } finally {
        setLoading(key, false)
        fetchPromises.value[key] = null
      }
    })()

    return fetchPromises.value[key]
  }

  async function fetchReactionsByComponentId(
    componentId: number,
    force = false,
  ) {
    const key = getKey('component', componentId)

    if (!force && loadedKeys.value.has(key)) return
    if (fetchPromises.value[key]) return fetchPromises.value[key]

    fetchPromises.value[key] = (async () => {
      setLoading(key, true)

      try {
        const res = await performFetch<Reaction[]>(
          `/api/reactions/component/${componentId}`,
        )
        if (!res.success) throw new Error(res.message)

        const incoming = res.data || []
        const existingIds = new Set(reactions.value.map((r) => r.id))
        const deduped = incoming.filter((r) => !existingIds.has(r.id))

        reactions.value = [...reactions.value, ...deduped]
        loadedKeys.value.add(key)
      } catch (e) {
        handleError(e, 'fetching reactions by component ID')
      } finally {
        setLoading(key, false)
        fetchPromises.value[key] = null
      }
    })()

    return fetchPromises.value[key]
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
        body: JSON.stringify(payload),
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

      const index = reactions.value.findIndex((r) => r.id === reactionId)
      if (index !== -1 && res.data) reactions.value[index] = res.data

      return res.data
    } catch (e) {
      handleError(e, 'updating reaction')
      throw e
    }
  }

  async function deleteReaction(reactionId: number) {
    try {
      const res = await performFetch(`/api/reactions/${reactionId}`, {
        method: 'DELETE',
      })

      if (!res.success) throw new Error(res.message)

      reactions.value = reactions.value.filter((r) => r.id !== reactionId)
    } catch (e) {
      handleError(e, 'deleting reaction')
    }
  }

  return {
    reactions,
    isInitialized,
    loadingMap,
    getReactionsByComponentId,
    getUserReactionForComponent,
    initialize,
    fetchReactionsByArtId,
    fetchReactionsByComponentId,
    addReaction,
    updateReaction,
    deleteReaction,
  }
})

export type { Reaction, ReactionType, ReactionCategory }
