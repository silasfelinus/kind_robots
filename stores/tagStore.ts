import { defineStore } from 'pinia'
import type { Tag } from '@prisma/client'
import { performFetch, handleError } from './utils'
import { useUserStore } from './userStore'

const isClient = typeof window !== 'undefined'

export const useTagStore = defineStore({
  id: 'tag',

  state: () => ({
    tags: [] as Tag[],
    isInitialized: false,
    selectedTag: null as Tag | null,
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

    initializeTags() {
      if (!this.isInitialized) {
        this.fetchTags()
        this.isInitialized = true
      }
    },

    async fetchTags() {
      await handleError(async () => {
        const response = await performFetch<Tag[]>('/api/tags')
        if (response.success) {
          this.tags = response.data || []
          if (isClient) {
            localStorage.setItem('tags', JSON.stringify(this.tags))
          }
        } else {
          throw new Error(response.message)
        }
      }, 'fetching tags')
    },

    async createTag(label: string, title: string, userId: number) {
      await handleError(async () => {
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
          throw new Error(response.message)
        }
      }, 'creating tag')
    },

    async editTag(id: number, updates: Partial<Tag>) {
      await handleError(async () => {
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
          throw new Error(response.message)
        }
      }, `editing tag ID: ${id}`)
    },

    async deleteTag(id: number) {
      await handleError(async () => {
        const response = await performFetch(`/api/tags/${id}`, {
          method: 'DELETE',
        })
        if (response.success) {
          this.tags = this.tags.filter((tag) => tag.id !== id)
          if (isClient) {
            localStorage.setItem('tags', JSON.stringify(this.tags))
          }
        } else {
          throw new Error(response.message)
        }
      }, `deleting tag ID: ${id}`)
    },
  },
})

export type { Tag }
