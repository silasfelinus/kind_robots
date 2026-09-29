// /stores/artFeedStore.ts
//
// The Gallery's image-first feed: newest art first, fetched a page at a time
// from /api/art/image/feed. Filters restart the feed; a response for filters
// that have since changed is dropped rather than merged into the new list.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import { useArtStore } from '@/stores/artStore'
import type {
  GalleryMaturityFilter,
  GalleryPrivacyFilter,
} from '@/stores/artCollectionBrowseStore'
import { handleError, performFetch } from '@/stores/utils'

export type ArtFeedImage = ArtImage & { thumbnailUrl: string }

export type ArtFeedFilters = {
  privacy: GalleryPrivacyFilter
  maturity: GalleryMaturityFilter
  collectionId: number | null
  search: string
}

type ArtFeedPage = {
  items: ArtFeedImage[]
  nextCursor: number | null
}

const PAGE_SIZE = 48

function feedQuery(filters: ArtFeedFilters, cursor: number | null): string {
  const params = new URLSearchParams()
  params.set('privacy', filters.privacy)
  params.set('maturity', filters.maturity)
  params.set('showMature', filters.maturity === 'safe' ? 'false' : 'true')
  params.set('limit', String(PAGE_SIZE))
  if (filters.collectionId) {
    params.set('collectionId', String(filters.collectionId))
  }
  if (filters.search.trim()) params.set('q', filters.search.trim())
  if (cursor) params.set('cursor', String(cursor))
  return params.toString()
}

export const useArtFeedStore = defineStore('artFeedStore', () => {
  const artStore = useArtStore()

  const items = ref<ArtFeedImage[]>([])
  const nextCursor = ref<number | null>(null)
  const exhausted = ref(false)
  const isLoading = ref(false)
  const errorMessage = ref('')
  const filters = ref<ArtFeedFilters>({
    privacy: 'public',
    maturity: 'safe',
    collectionId: null,
    search: '',
  })

  let generation = 0
  let pending: Promise<void> | null = null

  const hasMore = computed(() => !exhausted.value)

  async function loadPage(): Promise<void> {
    const requestGeneration = generation
    const cursor = nextCursor.value
    isLoading.value = true
    errorMessage.value = ''
    try {
      const response = await performFetch<ArtFeedPage>(
        `/api/art/image/feed?${feedQuery(filters.value, cursor)}`,
      )
      if (requestGeneration !== generation) return
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load the gallery.')
      }
      const known = new Set(items.value.map((image) => image.id))
      const fresh = response.data.items.filter((image) => !known.has(image.id))
      items.value = [...items.value, ...fresh]
      nextCursor.value = response.data.nextCursor
      exhausted.value = response.data.nextCursor === null
      if (fresh.length) artStore.addOrUpdateArtImages(fresh)
    } catch (error) {
      if (requestGeneration !== generation) return
      handleError(error, 'loading the art feed')
      errorMessage.value =
        error instanceof Error ? error.message : 'Failed to load the gallery.'
    } finally {
      if (requestGeneration === generation) isLoading.value = false
    }
  }

  async function loadMore(): Promise<void> {
    if (exhausted.value || errorMessage.value) return
    if (pending) return pending
    pending = loadPage().finally(() => {
      pending = null
    })
    return pending
  }

  async function reset(next: Partial<ArtFeedFilters> = {}): Promise<void> {
    generation += 1
    pending = null
    filters.value = { ...filters.value, ...next }
    items.value = []
    nextCursor.value = null
    exhausted.value = false
    errorMessage.value = ''
    await loadMore()
  }

  async function retry(): Promise<void> {
    errorMessage.value = ''
    await loadMore()
  }

  function removeImage(imageId: number): void {
    items.value = items.value.filter((image) => image.id !== imageId)
  }

  return {
    items,
    filters,
    isLoading,
    errorMessage,
    hasMore,
    loadMore,
    reset,
    retry,
    removeImage,
  }
})
