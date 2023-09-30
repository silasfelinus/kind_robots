import { defineStore } from 'pinia'
import { Tag } from '@prisma/client'
import { useUserStore } from '@/stores/userStore' // Import user store to get the active userId

interface TagState {
  tags: Tag[]
  isInitialized: boolean
}

const isClient = typeof window !== 'undefined'
const initialState = isClient ? JSON.parse(localStorage.getItem('tags') || '[]') : []

export const useTagStore = defineStore({
  id: 'tag',

  state: (): TagState => ({
    tags: initialState,
    isInitialized: false
  }),

  getters: {
    activeAndPublicTags(): Tag[] {
      const userStore = useUserStore()
      return this.tags.filter(
        (tag) => tag.isPublic || tag.userId === userStore.userId || tag.userId === 0
      )
    },

    pitches(): Tag[] {
      return this.tags.filter((tag) => tag.label === 'pitch')
    }
  },

  actions: {
    async initializeTags() {
      if (!this.isInitialized) {
        await this.fetchTags()
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
      } catch (error: any) {
        console.error('Error fetching tags:', error)
      }
    },

    async createTag(label: string, title: string, userId: number) {
      try {
        const response = await fetch('/api/tags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ label, title, userId, isPublic: false }) // isPublic set to false by default
        })

        if (response.ok) {
          const newTag = await response.json()
          this.tags.push(newTag)
          if (isClient) {
            localStorage.setItem('tags', JSON.stringify(this.tags))
          }
        }
      } catch (error: any) {
        console.error('Error creating tag:', error)
      }
    },

    async editTag(id: number, updates: Partial<Tag>) {
      try {
        const response = await fetch(`/api/tags/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updates)
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
        }
      } catch (error: any) {
        console.error('Error editing tag:', error)
      }
    },

    async deleteTag(id: number) {
      try {
        const response = await fetch(`/api/tags/${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          const index = this.tags.findIndex((tag) => tag.id === id)
          if (index !== -1) {
            this.tags.splice(index, 1)
            if (isClient) {
              localStorage.setItem('tags', JSON.stringify(this.tags))
            }
          }
        }
      } catch (error: any) {
        console.error('Error deleting tag:', error)
      }
    },
    // Get all titles with label "pitch"
    getPitchTitles(): string[] {
      return this.pitches.map((pitch) => pitch.title)
    },

    // Add a new pitch
    async addPitch(title: string, userId: number) {
      await this.createTag('pitch', title, userId)
    },

    // Select a pitch by title
    selectPitch(title: string): Tag | undefined {
      return this.pitches.find((pitch) => pitch.title === title)
    },

    // Delete a pitch by ID
    async deletePitch(id: number) {
      await this.deleteTag(id)
    },

    // Edit a pitch's title by ID
    async editPitchTitle(id: number, newTitle: string) {
      const pitch = this.tags.find((tag) => tag.id === id && tag.label === 'pitch')
      if (pitch) {
        await this.editTag(id, { title: newTitle })
      }
    }
  }
})

export type { Tag }
