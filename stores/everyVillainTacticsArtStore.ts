import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import { useUserStore } from './userStore'

export type PaintedMapArt = {
  src: string
  status: 'loading' | 'loaded' | 'failed'
}

/**
 * Generated ArtImages are private. The browser cannot attach JWT headers to
 * a CSS background URL, so fetch as the logged-in user and create an
 * authenticated blob URL, following the existing Slime City ArtJob pattern.
 * Never expose private art by making it public or embedding credentials.
 */
export const useEveryVillainTacticsArtStore = defineStore(
  'everyVillainTacticsArt',
  () => {
    const images = shallowRef<Record<number, PaintedMapArt>>({})
    let tokenUsed = ''
    let generation = 0

    function clear(): void {
      generation++
      if (import.meta.client)
        for (const image of Object.values(images.value))
          if (image.src) URL.revokeObjectURL(image.src)
      images.value = {}
      tokenUsed = ''
    }

    async function ensure(id: number | null): Promise<void> {
      if (!import.meta.client || !id) return
      const token = useUserStore().token ?? ''
      if (token !== tokenUsed) {
        clear()
        tokenUsed = token
      }
      if (images.value[id]) return
      const attempt = generation
      images.value = {
        ...images.value,
        [id]: { src: '', status: 'loading' },
      }
      try {
        const response = await fetch(`/api/art/images/${id}/file`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (
          !response.ok ||
          !(response.headers.get('content-type') ?? '').startsWith('image/')
        ) {
          throw new Error('Painted arena ArtImage unavailable')
        }
        const blob = await response.blob()
        if (generation !== attempt) return
        images.value = {
          ...images.value,
          [id]: { src: URL.createObjectURL(blob), status: 'loaded' },
        }
      } catch {
        if (generation !== attempt) return
        images.value = {
          ...images.value,
          [id]: { src: '', status: 'failed' },
        }
      }
    }

    return { images, ensure, clear }
  },
)
