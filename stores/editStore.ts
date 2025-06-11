// /stores/editStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { performFetch } from './utils'

interface EditRequest {
  imageId: number
  request: string
  preset: string
  userId: number
}

export const useEditStore = defineStore('editStore', () => {
  const presets = ref<string[]>([
    'Make it anime style',
    'Convert to black and white',
    'Add a dreamlike filter',
    'Enhance with high detail',
    'Blur background only',
  ])

  const loading = ref(false)
  const error = ref<string | null>(null)

  async function submitEdit(payload: {
    imageId: number
    request?: string
    preset?: string
    userId: number
  }): Promise<{ success: boolean; message: string }> {
    loading.value = true
    error.value = null

    try {
      const response = await performFetch('/api/edit', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      })

      loading.value = false

      if (response.success) {
        return { success: true, message: 'Edit submitted!' }
      } else {
        error.value = response.message || 'Edit failed.'
        return { success: false, message: error.value }
      }
    } catch (err) {
      loading.value = false
      const message =
        err instanceof Error ? err.message : 'Unknown error submitting edit.'
      error.value = message
      return { success: false, message }
    }
  }

  return {
    presets,
    loading,
    error,
    submitEdit,
  }
})
