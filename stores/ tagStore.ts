import { defineStore } from 'pinia'
import { Tag } from '@prisma/client'

interface TagState {
  tags: Tag[]
  isInitialized: boolean // To track if the store is initialized
}

interface TagStore extends TagState {
  // Actions
  initializeTags: () => Promise<void>
  fetchTags: () => Promise<void>
  createTag: (label: string, title: string) => Promise<void>
  editTag: (id: number, label: string, title: string) => Promise<void>
  deleteTag: (id: number) => Promise<void>
}

export const useTagStore = defineStore({
  id: 'tag',

  state: (): TagState => ({
    tags: JSON.parse(localStorage.getItem('tags') || '[]'),
    isInitialized: false
  }),

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
          this.tags = await response.json()
          localStorage.setItem('tags', JSON.stringify(this.tags))
        }
      } catch (error: any) {
        console.error('Error fetching tags:', error)
      }
    },

    async createTag(label: string, title: string) {
      try {
        const response = await fetch('/api/tags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ label, title })
        })

        if (response.ok) {
          const newTag = await response.json()
          this.tags.push(newTag)
          localStorage.setItem('tags', JSON.stringify(this.tags))
        }
      } catch (error: any) {
        console.error('Error creating tag:', error)
      }
    },

    async editTag(id: number, label: string, title: string) {
      try {
        const response = await fetch(`/api/tags/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ label, title })
        })

        if (response.ok) {
          const updatedTag = await response.json()
          const index = this.tags.findIndex((tag) => tag.id === id)
          if (index !== -1) {
            this.tags[index] = updatedTag
            localStorage.setItem('tags', JSON.stringify(this.tags))
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
            localStorage.setItem('tags', JSON.stringify(this.tags))
          }
        }
      } catch (error: any) {
        console.error('Error deleting tag:', error)
      }
    }
  }
})
