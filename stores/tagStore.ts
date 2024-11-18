import { defineStore } from 'pinia'
import type { Tag } from '@prisma/client'
import { performFetch } from './utils'
import { useUserStore } from './userStore'

const isClient = typeof window !== 'undefined'

export const useTagStore = defineStore({
  id: 'tag',

  state: () => ({
    tags: [] as Tag[],
    isInitialized: false,
    selectedTag: null as Tag | null,
    error: null as string | null,
    isLoading: false,
  }),

  getters: {
    activeAndPublicTags(): Tag[] {
      const userStore = useUserStore()
      return this.tags.filter(
        (tag) =>
          tag.isPublic || tag.userId === userStore.userId || tag.userId === 0,
      )
    },
  },

  actions: {
    selectTag(tagId: number) {
      const foundTag = this.tags.find((tag) => tag.id === tagId)
      if (foundTag) {
        this.selectedTag = foundTag
      } else {
        console.warn(`Tag with id ${tagId} not found.`)
      }
    },

    async initializeTags() {
      if (!this.isInitialized) {
        this.isInitialized = true
        await this.fetchTags()
      }
    },

    async fetchTags() {
      this.isLoading = true
      try {
        const response = await performFetch<Tag[]>('/api/tags')
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error(
            response.message || 'Invalid response format from the server',
          )
        }

        this.tags = response.data

        if (isClient) {
          localStorage.setItem('tags', JSON.stringify(this.tags))
        }
      } catch (error) {
        this.error = `Failed to fetch tags: ${error}`
        console.error(this.error)
      } finally {
        this.isLoading = false
      }
    },

    async createTag(label: string, title: string, userId: number) {
      try {
        const response = await performFetch<Tag>('/api/tags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ label, title, userId, isPublic: false }),
        })

        if (response.success && response.data) {
          this.tags.push(response.data)

          if (isClient) {
            localStorage.setItem('tags', JSON.stringify(this.tags))
          }
        } else {
          throw new Error(response.message || 'Failed to create tag')
        }
      } catch (error) {
        this.error = `Failed to create tag: ${error}`
        console.error(this.error)
      }
    },

    async editTag(id: number, updates: Partial<Tag>) {
      try {
        const response = await performFetch<Tag>(`/api/tags/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        if (response.success && response.data) {
          const index = this.tags.findIndex((tag) => tag.id === id)
          if (index !== -1) {
            this.tags[index] = { ...this.tags[index], ...response.data }

            if (isClient) {
              localStorage.setItem('tags', JSON.stringify(this.tags))
            }
          }
        } else {
          throw new Error(response.message || 'Failed to edit tag')
        }
      } catch (error) {
        this.error = `Failed to edit tag: ${error}`
        console.error(this.error)
      }
    },

    async deleteTag(id: number) {
      try {
        const response = await performFetch(`/api/tags/${id}`, {
          method: 'DELETE',
        })

        if (response.success) {
          this.tags = this.tags.filter((tag) => tag.id !== id)

          if (isClient) {
            localStorage.setItem('tags', JSON.stringify(this.tags))
          }
        } else {
          throw new Error(response.message || 'Failed to delete tag')
        }
      } catch (error) {
        this.error = `Failed to delete tag: ${error}`
        console.error(this.error)
      }
    },
  },
})

export type { Tag }
