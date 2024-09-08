import { defineStore } from 'pinia'
import type { Tag } from '@prisma/client'
import { useErrorStore, ErrorType } from './../stores/errorStore' // Import useErrorStore and ErrorType
import { useUserStore } from './../stores/userStore'

const isClient = typeof window !== 'undefined'

export const useTagStore = defineStore({
  id: 'tag',

  state: () => ({
    tags: [] as Tag[],
    isInitialized: false,
    selectedTag: null as Tag | null,
  }),

  getters: {
    // Filter tags based on public access and the current user
    activeAndPublicTags(): Tag[] {
      const userStore = useUserStore()
      return this.tags.filter(
        (tag) =>
          tag.isPublic || tag.userId === userStore.userId || tag.userId === 0,
      )
    },
  },

  actions: {
    // Select a tag by its ID
    selectTag(tagId: number) {
      const foundTag = this.tags.find((tag) => tag.id === tagId)
      if (foundTag) {
        this.selectedTag = foundTag
      } else {
        console.warn(`Tag with id ${tagId} not found.`)
      }
    },

    // Initialize tags by fetching them if not initialized
    initializeTags() {
      if (!this.isInitialized) {
        this.fetchTags()
        this.isInitialized = true
      }
    },

    // Fetch tags from the API and handle errors
    async fetchTags() {
      const errorStore = useErrorStore()

      try {
        const response = await fetch('/api/tags')
        if (response.ok) {
          const data = await response.json()
          this.tags = data.tags
          if (isClient) {
            localStorage.setItem('tags', JSON.stringify(this.tags))
          }
        } else {
          const errorText = await response.text()
          errorStore.setError(
            ErrorType.VALIDATION_ERROR,
            `Failed to fetch tags: ${errorText}`,
          )
        }
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `Error fetching tags: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    },

    // Create a new tag and handle errors
    async createTag(label: string, title: string, userId: number) {
      const errorStore = useErrorStore()

      try {
        const response = await fetch('/api/tags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ label, title, userId, isPublic: false }), // Default isPublic to false
        })

        if (response.ok) {
          const newTag = await response.json()
          this.tags.push(newTag)
          if (isClient) {
            localStorage.setItem('tags', JSON.stringify(this.tags))
          }
        } else {
          const errorText = await response.text()
          errorStore.setError(
            ErrorType.VALIDATION_ERROR,
            `Failed to create tag: ${errorText}`,
          )
        }
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `Error creating tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    },

    // Edit an existing tag and handle errors
    async editTag(id: number, updates: Partial<Tag>) {
      const errorStore = useErrorStore()

      try {
        const response = await fetch(`/api/tags/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        })

        if (response.ok) {
          const data = await response.json()
          const updatedTag = data.tag
          const index = this.tags.findIndex((tag) => tag.id === id)
          if (index !== -1) {
            this.tags[index] = { ...this.tags[index], ...updatedTag }
            if (isClient) {
              localStorage.setItem('tags', JSON.stringify(this.tags))
            }
          }
        } else {
          const errorText = await response.text()
          errorStore.setError(
            ErrorType.VALIDATION_ERROR,
            `Failed to edit tag: ${errorText}`,
          )
        }
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `Error editing tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    },

    // Delete a tag by its ID and handle errors
    async deleteTag(id: number) {
      const errorStore = useErrorStore()

      try {
        const response = await fetch(`/api/tags/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          const index = this.tags.findIndex((tag) => tag.id === id)
          if (index !== -1) {
            this.tags.splice(index, 1)
            if (isClient) {
              localStorage.setItem('tags', JSON.stringify(this.tags))
            }
          }
        } else {
          const errorText = await response.text()
          errorStore.setError(
            ErrorType.VALIDATION_ERROR,
            `Failed to delete tag: ${errorText}`,
          )
        }
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `Error deleting tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    },
  },
})

export type { Tag }
