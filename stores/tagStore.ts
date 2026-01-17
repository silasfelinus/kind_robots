// /stores/tagStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Tag } from '~/prisma/generated/prisma/client'
import { performFetch } from './utils'
import { useUserStore } from './userStore'

const isClient = typeof window !== 'undefined'

export const useTagStore = defineStore('tagStore', () => {
  const tags = ref<Tag[]>([])
  const isInitialized = ref(false)
  const selectedTag = ref<Tag | null>(null)
  const error = ref<string | null>(null)
  const isLoading = ref(false)

  const userStore = useUserStore()

  const activeAndPublicTags = computed(() => {
    const uid = userStore.userId
    return tags.value.filter((tag) => {
      const isPublic = tag.isPublic ?? false
      const tagUserId = tag.userId ?? null
      return isPublic || (uid != null && tagUserId === uid) || tagUserId === 0
    })
  })

  function selectTag(tagId: number) {
    const foundTag = tags.value.find((tag) => tag.id === tagId)
    if (foundTag) {
      selectedTag.value = foundTag
      return
    }
    console.warn(`Tag with id ${tagId} not found.`)
  }

  async function initializeTags() {
    if (isInitialized.value) return
    isInitialized.value = true
    await fetchTags()
  }

  async function fetchTags() {
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

      if (isClient) {
        localStorage.setItem('tags', JSON.stringify(tags.value))
      }
    } catch (err) {
      error.value = `Failed to fetch tags: ${err}`
      console.error(error.value)
    } finally {
      isLoading.value = false
    }
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

      if (isClient) {
        localStorage.setItem('tags', JSON.stringify(tags.value))
      }
    } catch (err) {
      error.value = `Failed to create tag: ${err}`
      console.error(error.value)
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

        if (isClient) {
          localStorage.setItem('tags', JSON.stringify(tags.value))
        }
      }
    } catch (err) {
      error.value = `Failed to edit tag: ${err}`
      console.error(error.value)
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

      if (isClient) {
        localStorage.setItem('tags', JSON.stringify(tags.value))
      }
    } catch (err) {
      error.value = `Failed to delete tag: ${err}`
      console.error(error.value)
    }
  }

  return {
    tags,
    isInitialized,
    selectedTag,
    error,
    isLoading,
    activeAndPublicTags,
    selectTag,
    initializeTags,
    fetchTags,
    createTag,
    editTag,
    deleteTag,
  }
})

export type { Tag }
