// /stores/tagStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Tag } from '@prisma/client'
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
    return tags.value.filter(
      (tag) =>
        tag.isPublic || tag.userId === userStore.userId || tag.userId === 0,
    )
  })

  function selectTag(tagId: number) {
    const foundTag = tags.value.find((tag) => tag.id === tagId)
    if (foundTag) {
      selectedTag.value = foundTag
    } else {
      console.warn(`Tag with id ${tagId} not found.`)
    }
  }

  async function initializeTags() {
    if (!isInitialized.value) {
      isInitialized.value = true
      await fetchTags()
    }
  }

  async function fetchTags() {
    isLoading.value = true
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
    try {
      const response = await performFetch<Tag>('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, title, userId, isPublic: false }),
      })
      if (response.success && response.data) {
        tags.value.push(response.data)
        if (isClient) {
          localStorage.setItem('tags', JSON.stringify(tags.value))
        }
      } else {
        throw new Error(response.message || 'Failed to create tag')
      }
    } catch (err) {
      error.value = `Failed to create tag: ${err}`
      console.error(error.value)
    }
  }

  async function editTag(id: number, updates: Partial<Tag>) {
    try {
      const response = await performFetch<Tag>(`/api/tags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (response.success && response.data) {
        const index = tags.value.findIndex((tag) => tag.id === id)
        if (index !== -1) {
          tags.value[index] = { ...tags.value[index], ...response.data }
          if (isClient) {
            localStorage.setItem('tags', JSON.stringify(tags.value))
          }
        }
      } else {
        throw new Error(response.message || 'Failed to edit tag')
      }
    } catch (err) {
      error.value = `Failed to edit tag: ${err}`
      console.error(error.value)
    }
  }

  async function deleteTag(id: number) {
    try {
      const response = await performFetch(`/api/tags/${id}`, {
        method: 'DELETE',
      })
      if (response.success) {
        tags.value = tags.value.filter((tag) => tag.id !== id)
        if (isClient) {
          localStorage.setItem('tags', JSON.stringify(tags.value))
        }
      } else {
        throw new Error(response.message || 'Failed to delete tag')
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
