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
    async submitEdit(payload: {
      imageId: number
      request?: string
      preset?: string
      userId: number
    }): Promise<{ success: boolean; message: string }> {
      try {
        const response = await performFetch('/api/edit', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        })

        if (response.success) {
          return { success: true, message: 'Edit submitted!' }
        } else {
          return { success: false, message: response.message || 'Edit failed.' }
        }
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Unknown error submitting edit.',
        }
      }
    },
  },
})
