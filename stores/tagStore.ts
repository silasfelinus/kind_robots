// /stores/tagStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Tag } from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from './utils'
import { useUserStore } from './userStore'

const isClient = typeof window !== 'undefined'
const TAGS_STORAGE_KEY = 'tags'

export const useTagStore = defineStore('tagStore', () => {
  const tags = ref<Tag[]>([])
  const isInitialized = ref(false)
  const selectedTag = ref<Tag | null>(null)
  const error = ref<string | null>(null)
  const isLoading = ref(false)

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchPromise = ref<Promise<void> | null>(null)
  const hasLoaded = ref(false)

  const userStore = useUserStore()

  const activeAndPublicTags = computed(() => {
    const uid = userStore.userId
    return tags.value.filter((tag) => {
      const isPublic = tag.isPublic ?? false
      const tagUserId = tag.userId ?? null
      return isPublic || (uid != null && tagUserId === uid) || tagUserId === 0
    })
  })

  function loadFromLocalStorage() {
    if (!isClient) return

    try {
      const saved = localStorage.getItem(TAGS_STORAGE_KEY)
      if (!saved) return

      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        tags.value = parsed as Tag[]
      }
    } catch (err) {
      handleError(err, 'loading tags from localStorage')
    }
  }

  function syncToLocalStorage() {
    if (!isClient) return

    try {
      localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags.value))
    } catch (err) {
      handleError(err, 'saving tags to localStorage')
    }
  }

  function selectTag(tagId: number) {
    const foundTag = tags.value.find((tag) => tag.id === tagId)
    if (foundTag) {
      selectedTag.value = foundTag
      return
    }

    console.warn(`Tag with id ${tagId} not found.`)
  }

  async function initializeTags(): Promise<void> {
    if (isInitialized.value) return
    if (initializePromise.value) return initializePromise.value

    initializePromise.value = (async () => {
      try {
        loadFromLocalStorage()
        await fetchTags()
        isInitialized.value = true
      } catch (err) {
        isInitialized.value = false
        handleError(err, 'initializing tags')
      } finally {
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function fetchTags(force = false): Promise<void> {
    if (!force && hasLoaded.value) return
    if (fetchPromise.value) return fetchPromise.value

    fetchPromise.value = (async () => {
      isLoading.value = true
      error.value = null

      try {
        const response = await performFetch<Tag[]>('/api/tags')

        if (!response.success || !Array.isArray(response.data)) {
          throw new Error(
            response.message || 'Invalid response format from the server',
          )
        }

        tags.value = response.data
        hasLoaded.value = true
        syncToLocalStorage()
      } catch (err) {
        hasLoaded.value = false
        error.value =
          err instanceof Error ? err.message : 'Failed to fetch tags'
        handleError(err, 'fetching tags')
      } finally {
        isLoading.value = false
        fetchPromise.value = null
      }
    })()

    return fetchPromise.value
  }

  async function createTag(label: string, title: string, userId: number) {
    error.value = null

    try {
      const response = await performFetch<Tag>('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, title, userId, isPublic: false }),
      })

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create tag')
      }

      tags.value.push(response.data)
      syncToLocalStorage()
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create tag'
      handleError(err, 'creating tag')
      return null
    }
  }

  async function editTag(id: number, updates: Partial<Tag>) {
    error.value = null

    try {
      const response = await performFetch<Tag>(`/api/tags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to edit tag')
      }

      const index = tags.value.findIndex((tag) => tag.id === id)
      if (index !== -1) {
        tags.value[index] = { ...tags.value[index], ...response.data }
        if (selectedTag.value?.id === id) {
          selectedTag.value = tags.value[index]
        }
        syncToLocalStorage()
      }

      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to edit tag'
      handleError(err, 'editing tag')
      return null
    }
  }

  async function deleteTag(id: number) {
    error.value = null

    try {
      const response = await performFetch(`/api/tags/${id}`, {
        method: 'DELETE',
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete tag')
      }

      tags.value = tags.value.filter((tag) => tag.id !== id)

      if (selectedTag.value?.id === id) {
        selectedTag.value = null
      }

      syncToLocalStorage()
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete tag'
      handleError(err, 'deleting tag')
      return false
    }
  }

  return {
    tags,
    isInitialized,
    selectedTag,
    error,
    isLoading,
    initializePromise,
    fetchPromise,
    hasLoaded,
    activeAndPublicTags,
    loadFromLocalStorage,
    syncToLocalStorage,
    selectTag,
    initializeTags,
    fetchTags,
    createTag,
    editTag,
    deleteTag,
  }
})

export type { Tag }
