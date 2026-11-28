import { defineStore } from 'pinia'
import { computed, shallowRef, watch } from 'vue'
import { useUserStore } from '~/stores/userStore'
import { renderedArtImageId } from '~/utils/crystalStreet/renderedArt'

const MAX_CACHED = 64
const RETRYABLE = new Set([429, 500, 502, 503, 504])

export const useCrystalStreetArtStore = defineStore('crystalStreetArt', () => {
  const user = useUserStore()
  const sessionToken = computed(() => user.token ?? '')
  const canLoad = computed(() => user.isAdmin && !!sessionToken.value)
  const sources = shallowRef<Record<number, string>>({})
  const pending = new Set<number>()
  const order: number[] = []
  let generation = 0

  function clear(): void {
    generation++
    if (import.meta.client)
      for (const src of Object.values(sources.value)) URL.revokeObjectURL(src)
    sources.value = {}
    pending.clear()
    order.length = 0
  }

  watch([sessionToken, canLoad], clear, { flush: 'sync' })

  function sourceFor(path: string): string {
    if (!canLoad.value) return path
    const id = renderedArtImageId(path)
    return (id && sources.value[id]) || path
  }

  async function ensure(path: string): Promise<void> {
    const id = renderedArtImageId(path)
    if (!import.meta.client || !canLoad.value || !id) return
    if (sources.value[id] || pending.has(id)) return
    const version = generation
    const token = sessionToken.value
    pending.add(id)
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (version !== generation) return
        try {
          const response = await fetch(`/api/art/images/${id}/file`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!response.ok) {
            if (!RETRYABLE.has(response.status)) return
            throw new Error('Retryable media response')
          }
          if (
            !(response.headers.get('content-type') ?? '')
              .toLowerCase()
              .startsWith('image/')
          )
            return
          const blob = await response.blob()
          if (version !== generation || blob.size < 24) return
          const src = URL.createObjectURL(blob)
          try {
            const image = new Image()
            image.src = src
            await image.decode()
            if (!image.naturalWidth || !image.naturalHeight)
              throw new Error('Invalid image dimensions')
            if (version !== generation) {
              URL.revokeObjectURL(src)
              return
            }
            const next = { ...sources.value, [id]: src }
            order.push(id)
            if (order.length > MAX_CACHED) {
              const oldest = order.shift()!
              URL.revokeObjectURL(next[oldest]!)
              Reflect.deleteProperty(next, oldest)
            }
            sources.value = next
            return
          } catch {
            URL.revokeObjectURL(src)
            return
          }
        } catch {
          if (attempt === 2 || version !== generation) return
          await new Promise((resolve) =>
            setTimeout(resolve, 250 * 2 ** attempt),
          )
        }
      }
    } finally {
      if (version === generation) pending.delete(id)
    }
  }

  return { canLoad, sessionToken, sourceFor, ensure, clear }
})
