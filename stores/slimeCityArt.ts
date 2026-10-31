import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import { useUserStore } from './userStore'

export type SlimeCityArtStatus = 'loading' | 'loaded' | 'failed'

export type SlimeCityArtRecord = {
  status: SlimeCityArtStatus
  src: string
}

/**
 * ArtJobs in Conductor produce PRIVATE ArtImages. A plain <img> cannot send
 * our JWT, so retrieve image bytes with the logged-in user's authorization
 * and show temporary blob URLs. No image is made public or stored in localStorage.
 */
export const useSlimeCityArtStore = defineStore('slimeCityArt', () => {
  const images = shallowRef<Record<number, SlimeCityArtRecord>>({})
  let tokenUsed = ''
  let generation = 0

  const loadedCount = computed(
    () => Object.values(images.value).filter((entry) => entry.status === 'loaded').length,
  )
  const failedCount = computed(
    () => Object.values(images.value).filter((entry) => entry.status === 'failed').length,
  )

  function clear(): void {
    generation += 1
    for (const image of Object.values(images.value)) {
      if (image.src && import.meta.client) URL.revokeObjectURL(image.src)
    }
    images.value = {}
    tokenUsed = ''
  }

  async function ensure(artImageId: number | null): Promise<void> {
    if (!import.meta.client || !artImageId) return
    const token = useUserStore().token ?? ''
    if (token !== tokenUsed) {
      clear()
      tokenUsed = token
    }
    if (!token || images.value[artImageId]) return

    const currentGeneration = generation
    images.value = {
      ...images.value,
      [artImageId]: { status: 'loading', src: '' },
    }
    try {
      const response = await fetch(`/api/art/images/${artImageId}/file`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const mediaType = response.headers.get('content-type') ?? ''
      if (!response.ok || !mediaType.startsWith('image/')) {
        throw new Error(`ArtImage ${artImageId} is unavailable`)
      }
      const bytes = await response.blob()
      if (currentGeneration !== generation) return
      const src = URL.createObjectURL(bytes)
      images.value = {
        ...images.value,
        [artImageId]: { status: 'loaded', src },
      }
    } catch {
      if (currentGeneration !== generation) return
      images.value = {
        ...images.value,
        [artImageId]: { status: 'failed', src: '' },
      }
    }
  }

  return { images, loadedCount, failedCount, ensure, clear }
})
