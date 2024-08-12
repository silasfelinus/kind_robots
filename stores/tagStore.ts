import { defineStore } from 'pinia'
import type { Tag } from '@prisma/client'
import { errorHandler } from '../server/api/utils/error'
import { useUserStore } from '@/stores/userStore'

const isClient = typeof window !== 'undefined'

export const useTagStore = defineStore({
  id: 'tag',

  state: () => ({
    tags: [] as Tag[],
    isInitialized: false,
    selectedPitch: null as Tag | null,
  }),

  getters: {
    activeAndPublicTags(): Tag[] {
      const userStore = useUserStore()
      return this.tags.filter(tag => tag.isPublic || tag.userId === userStore.userId || tag.userId === 0)
    },
    pitches(): Tag[] {
      return (this.tags ?? []).filter(tag => tag.label === 'pitch')
    },
  },

  actions: {
    selectPitch(pitchId: number) {
      const foundPitch = this.pitches.find(pitch => pitch.id === pitchId)
      if (foundPitch) {
        this.selectedPitch = foundPitch
      }
      else {
        console.warn(`Pitch with id ${pitchId} not found.`)
      }
    },

    initializeTags() {
      // Fetch tags if not already initialized
      if (!this.isInitialized) {
        this.fetchTags()
        this.isInitialized = true
      }
    },

    async fetchTags() {
      try {
        const response = await fetch('/api/tags')
        if (response.ok) {
          const data = await response.json()
          this.tags = data.tags
          if (isClient) {
            localStorage.setItem('tags', JSON.stringify(this.tags))
          }
        }
        else {
          const errorText = await response.text()
          const handledError = errorHandler(new Error(errorText))
          console.error('Failed to fetch tags:', handledError.message)
        }
      }
      catch (error: unknown) {
        const handledError = errorHandler(error)
        console.error('Error fetching tags:', handledError.message)
      }
    },

    async createTag(label: string, title: string, userId: number) {
      try {
        const response = await fetch('/api/tags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ label, title, userId, isPublic: false }), // isPublic set to false by default
        })

        if (response.ok) {
          const newTag = await response.json()
          this.tags.push(newTag)
          if (isClient) {
            localStorage.setItem('tags', JSON.stringify(this.tags))
          }
        }
      }
      catch (error: unknown) {
        console.error('Error creating tag:', error)
      }
    },

    async editTag(id: number, updates: Partial<Tag>) {
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
          const index = this.tags.findIndex(tag => tag.id === id)
          if (index !== -1) {
            this.tags[index] = { ...this.tags[index], ...updatedTag }
            if (isClient) {
              localStorage.setItem('tags', JSON.stringify(this.tags))
            }
          }
        }
      }
      catch (error: unknown) {
        console.error('Error editing tag:', error)
      }
    },

    async deleteTag(id: number) {
      try {
        const response = await fetch(`/api/tags/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          const index = this.tags.findIndex(tag => tag.id === id)
          if (index !== -1) {
            this.tags.splice(index, 1)
            if (isClient) {
              localStorage.setItem('tags', JSON.stringify(this.tags))
            }
          }
        }
      }
      catch (error: unknown) {
        console.error('Error deleting tag:', error)
      }
    },
    // Get all titles with label "pitch"
    getPitchTitles(): string[] {
      return this.pitches.map(pitch => pitch.title)
    },

    // Add a new pitch
    async addPitch(title: string, userId: number) {
      await this.createTag('pitch', title, userId)
    },

    // Delete a pitch by ID
    async deletePitch(id: number) {
      await this.deleteTag(id)
    },

    // Edit a pitch's title by ID
    async editPitchTitle(id: number, newTitle: string) {
      const pitch = this.tags.find(tag => tag.id === id && tag.label === 'pitch')
      if (pitch) {
        await this.editTag(id, { title: newTitle })
      }
    },
    async updatePitch(id: number, updates: Partial<Tag>) {
      const pitch = this.tags.find(tag => tag.id === id && tag.label === 'pitch')
      if (pitch) {
        try {
          await this.editTag(id, updates)
        }
        catch (error: unknown) {
          const handledError = errorHandler(error)
          console.error('Error updating pitch:', handledError.message)
        }
      }
    },
  },
})

export type { Tag }
