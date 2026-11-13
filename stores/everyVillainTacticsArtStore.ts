import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import { useUserStore } from './userStore'

/**
 * Art modeler results, already DONE in Conductor's tactical arena ledger.
 * These are genuine painted ArtImages (not SVG or CSS illustrations).
 * The map/cover/LOS grid remains code-owned independently of the painting.
 *
 * Source: conductor/projects/every-villain-tactics/art/TACTICAL-ARENAS-ROUND-1.yaml
 */
export const PAINTED_EVT_MAP_ART: Readonly<Record<string, number>> = {
  'first-bell': 265014,
  'college-quad': 265015,
  'science-lab': 265017,
  'quarry-lieutenant': 265019,
  'picnic-plaza': 265016,
  'quad-portal-watch': 265015,
  'lab-mascot-recall': 265017,
  'boiler-room': 265018,
}

export function paintedMapArtId(stageId: string | null): number | null {
  if (stageId === null) return PAINTED_EVT_MAP_ART['first-bell'] ?? null
  return PAINTED_EVT_MAP_ART[stageId] ?? null
}

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
