// /stores/entityArtLinkStore.ts
//
// Resolve an ArtJob's entity reference to a name and a link, one request per
// batch rather than one per card.
//
// A queue card knows only `{ entityType: 'resource', entityId: 2726 }` -- it
// can say an image was made FOR something but not what. The browser renders up
// to 200 cards at once, so a per-card fetch is 200 round trips for what the
// server answers in nine queries at most. References raised in the same tick
// are collected into one request, and answers are cached for the session: a
// queue of LoRA probes asks about the same resources repeatedly as it pages.
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { performFetch } from '@/stores/utils'
import { entityArtRefKey } from '@/utils/entityArtLink'

export type EntityArtLink = {
  entityType: string
  entityId: number
  /** null when the object was deleted after its art was queued. */
  label: string | null
  href: string | null
  exists: boolean
  /* Card fields, resolved in the same request so opening one costs nothing. */
  description?: string | null
  imagePath?: string | null
  /** The joined ArtImage's static path -- what renders in an <img> tag. */
  artImagePath?: string | null
  artImageId?: number | null
  previewImageUrl?: string | null
  isMature?: boolean
  detail?: string | null
}

export const useEntityArtLinkStore = defineStore('entityArtLinkStore', () => {
  const links = ref<Record<string, EntityArtLink | null>>({})
  const pending = new Set<string>()
  const inFlight = new Set<string>()
  let scheduled = false

  async function flush() {
    scheduled = false
    const batch = [...pending]
    pending.clear()
    if (!batch.length) return
    batch.forEach((key) => inFlight.add(key))

    try {
      const res = await performFetch<{ links: Record<string, EntityArtLink> }>(
        `/api/art/entity-links?refs=${encodeURIComponent(batch.join(','))}`,
      )
      const resolved = res.data?.links ?? {}
      const next = { ...links.value }
      for (const key of batch) {
        // A key the server did not answer is cached as null rather than left
        // absent, or every re-render asks again for a reference it cannot
        // resolve.
        next[key] = resolved[key] ?? null
      }
      links.value = next
    } catch {
      const next = { ...links.value }
      for (const key of batch) next[key] = null
      links.value = next
    } finally {
      batch.forEach((key) => inFlight.delete(key))
    }
  }

  function request(
    entityType: string | null | undefined,
    entityId: number | null | undefined,
  ): void {
    if (!entityType) return
    const id = Number(entityId)
    if (!Number.isInteger(id) || id <= 0) return
    const key = entityArtRefKey(entityType, id)
    if (key in links.value || inFlight.has(key) || pending.has(key)) return
    pending.add(key)
    if (scheduled) return
    scheduled = true
    // Microtask, so every card mounted in this render joins a single request.
    Promise.resolve().then(flush)
  }

  function get(
    entityType: string | null | undefined,
    entityId: number | null | undefined,
  ): EntityArtLink | null {
    if (!entityType) return null
    const id = Number(entityId)
    if (!Number.isInteger(id) || id <= 0) return null
    return links.value[entityArtRefKey(entityType, id)] ?? null
  }

  return { links, request, get }
})
