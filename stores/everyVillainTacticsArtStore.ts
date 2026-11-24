import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import { useUserStore } from './userStore'
import { matchesCrewTelegraphDimensions } from '~/utils/everyVillainTactics/crewTelegraphMedia'

export type PaintedMapArt = {
  src: string
  status: 'loading' | 'loaded' | 'failed'
}

const RETRYABLE_MEDIA_STATUSES = new Set([429, 500, 502, 503, 504])
const MAX_MEDIA_ATTEMPTS = 3

function pauseBeforeRetry(attempt: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt))
}

/**
 * Generated ArtImages stay private: browser CSS URLs cannot send JWT headers.
 * Retrieve binary image bytes with the signed-in user's authorization, then
 * expose only a local object URL to the battlefield and art review panels.
 *
 * Production image proofs have seen transient 429/5xx responses during large
 * batches. Retry only those statuses and network/read errors, never 401/403,
 * missing images, non-image responses, or broken authorization.
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

    async function fetchPrivateImage(
      id: number,
      token: string,
      requestGeneration: number,
    ): Promise<Blob | null> {
      for (let attempt = 0; attempt < MAX_MEDIA_ATTEMPTS; attempt++) {
        if (requestGeneration !== generation) return null
        let response: Response
        try {
          response = await fetch(`/api/art/images/${id}/file`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
        } catch (error) {
          if (attempt === MAX_MEDIA_ATTEMPTS - 1) throw error
          await pauseBeforeRetry(attempt)
          continue
        }

        if (!response.ok) {
          if (
            !RETRYABLE_MEDIA_STATUSES.has(response.status) ||
            attempt === MAX_MEDIA_ATTEMPTS - 1
          )
            throw new Error('Private painted art is unavailable')
          await pauseBeforeRetry(attempt)
          continue
        }

        if (
          !(response.headers.get('content-type') ?? '')
            .toLowerCase()
            .startsWith('image/')
        )
          throw new Error('Private art returned non-image content')

        try {
          const blob = await response.blob()
          if (blob.size < 24)
            throw new Error('Private art returned empty image bytes')
          return blob
        } catch (error) {
          if (attempt === MAX_MEDIA_ATTEMPTS - 1) throw error
          await pauseBeforeRetry(attempt)
        }
      }
      throw new Error('Private painted art retry limit reached')
    }

    /**
     * A successful HTTP response can still be corrupt. Decode the private
     * object URL before exposing it to gameplay as a loaded painting.
     */
    async function decodeImage(id: number, blob: Blob): Promise<string> {
      const src = URL.createObjectURL(blob)
      try {
        const image = new Image()
        image.src = src
        await image.decode()
        if (image.naturalWidth <= 0 || image.naturalHeight <= 0)
          throw new Error('Painted art has invalid dimensions')
        if (
          !matchesCrewTelegraphDimensions(
            id,
            image.naturalWidth,
            image.naturalHeight,
          )
        )
          throw new Error('Painted art does not match its verified dimensions')
        return src
      } catch (error) {
        URL.revokeObjectURL(src)
        throw error
      }
    }

    async function ensure(id: number | null): Promise<void> {
      if (!import.meta.client || !id) return
      const token = useUserStore().token ?? ''
      if (token !== tokenUsed) {
        clear()
        tokenUsed = token
      }
      if (images.value[id]) return
      const requestGeneration = generation
      images.value = {
        ...images.value,
        [id]: { src: '', status: 'loading' },
      }
      try {
        const blob = await fetchPrivateImage(id, token, requestGeneration)
        if (requestGeneration !== generation || !blob) return
        const src = await decodeImage(id, blob)
        if (requestGeneration !== generation) {
          URL.revokeObjectURL(src)
          return
        }
        images.value = {
          ...images.value,
          [id]: { src, status: 'loaded' },
        }
      } catch {
        if (requestGeneration !== generation) return
        images.value = {
          ...images.value,
          [id]: { src: '', status: 'failed' },
        }
      }
    }

    /** A failed request should be recoverable after an intermittent outage. */
    async function retry(id: number | null): Promise<void> {
      if (!id || images.value[id]?.status !== 'failed') return
      const next: Record<number, PaintedMapArt> = {}
      for (const [key, image] of Object.entries(images.value))
        if (Number(key) !== id) next[Number(key)] = image
      images.value = next
      await ensure(id)
    }

    return { images, ensure, retry, clear }
  },
)
