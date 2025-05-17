// /stores/editStore.ts
import { defineStore } from 'pinia'
import { performFetch, handleError } from './utils'

interface EditRequest {
  imageId: number
  request: string
  preset: string
  userId: number
}

interface EditState {
  presets: string[]
  loading: boolean
  error: string | null
}

export const useEditStore = defineStore('editStore', {
  state: (): EditState => ({
    presets: [
      'Make it anime style',
      'Convert to black and white',
      'Add a dreamlike filter',
      'Enhance with high detail',
      'Blur background only',
    ],
    loading: false,
    error: null,
  }),

  actions: {
    async submitEdit(edit: EditRequest) {
      this.loading = true
      this.error = null

      try {
        const response = await performFetch('/api/edit/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(edit),
        })

        if (!response.success) {
          throw new Error(response.message || 'Edit submission failed')
        }
      } catch (err: any) {
        handleError(err, 'submitEdit')
      } finally {
        this.loading = false
      }
    },
  },
})
