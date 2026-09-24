import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import { useArtStore } from '@/stores/artStore'
import { handleError, performFetch } from '@/stores/utils'

export type BrowseArtCollection = ArtCollection & {
  artImages?: ArtImage[]
  ArtImages?: ArtImage[]
  images?: ArtImage[]
  artImageCount?: number
  previewArtImage?: ArtImage | null
  _count?: { ArtImages?: number }
}

export type GalleryMaturityFilter = 'all' | 'mature' | 'safe'
export type GalleryPrivacyFilter = 'all' | 'public' | 'private'

export type UnsortedArtSummary = {
  count: number
  totalCount: number
  previewArtImage: ArtImage | null
}

type ApiCollection = BrowseArtCollection & {
  ArtImages?: ArtImage[]
}

const EMPTY_UNSORTED_SUMMARY: UnsortedArtSummary = {
  count: 0,
  totalCount: 0,
  previewArtImage: null,
}

function normalizeCollection(collection: ApiCollection): BrowseArtCollection {
  const images = Array.isArray(collection.ArtImages)
    ? collection.ArtImages
    : Array.isArray(collection.artImages)
      ? collection.artImages
      : Array.isArray(collection.images)
        ? collection.images
        : []

  return {
    ...collection,
    artImages: images,
    ArtImages: images,
    images,
  }
}

function browseQuery(
  maturity: GalleryMaturityFilter,
  privacy: GalleryPrivacyFilter,
): string {
  const params = new URLSearchParams()
  params.set('maturity', maturity)
  params.set('privacy', privacy)
  params.set('showMature', maturity === 'safe' ? 'false' : 'true')
  return params.toString()
}

export const useArtCollectionBrowseStore = defineStore(
  'artCollectionBrowseStore',
  () => {
    const collectionDetails = ref<Record<number, BrowseArtCollection>>({})
    const collectionSummaries = ref<Record<number, BrowseArtCollection>>({})
    const unsortedSummary = ref<UnsortedArtSummary>({
      ...EMPTY_UNSORTED_SUMMARY,
    })
    const unsortedImages = ref<ArtImage[]>([])

    const loadedCollectionIds = new Set<number>()
    const collectionRequests = new Map<
      number,
      Promise<BrowseArtCollection | null>
    >()
    const collectionSummaryRequests = new Map<
      number,
      Promise<BrowseArtCollection | null>
    >()
    let unsortedSummaryRequest: Promise<UnsortedArtSummary> | null = null
    let unsortedImagesRequest: Promise<ArtImage[]> | null = null
    let unsortedSummaryScopeKey = ''
    let unsortedImagesScopeKey = ''
    const unsortedSummaryLoaded = ref(false)

    const artStore = useArtStore()

    async function fetchCollectionDetail(
      collectionId: number,
      force = false,
    ): Promise<BrowseArtCollection | null> {
      const id = Number(collectionId)
      if (!Number.isInteger(id) || id <= 0) return null

      if (!force && loadedCollectionIds.has(id)) {
        return collectionDetails.value[id] ?? null
      }

      if (!force && collectionRequests.has(id)) {
        return collectionRequests.get(id) ?? null
      }

      const request = (async () => {
        try {
          const response = await performFetch<ApiCollection>(
            `/api/art/collection/${id}`,
          )

          if (!response.success || !response.data) {
            throw new Error(
              response.message || `Failed to load collection #${id}.`,
            )
          }

          const normalized = normalizeCollection(response.data)
          collectionDetails.value = {
            ...collectionDetails.value,
            [id]: normalized,
          }
          loadedCollectionIds.add(id)

          const images = normalized.ArtImages ?? []
          if (images.length) artStore.addOrUpdateArtImages(images)

          return normalized
        } catch (error) {
          handleError(error, `loading collection #${id}`)
          return null
        } finally {
          collectionRequests.delete(id)
        }
      })()

      collectionRequests.set(id, request)
      return request
    }

    async function fetchCollectionSummary(
      collectionId: number,
      force = false,
      maturity: GalleryMaturityFilter = 'all',
      privacy: GalleryPrivacyFilter = 'public',
    ): Promise<BrowseArtCollection | null> {
      const id = Number(collectionId)
      if (!Number.isInteger(id) || id <= 0) return null

      if (!force && collectionSummaries.value[id]) {
        return collectionSummaries.value[id] ?? null
      }
      if (!force && collectionSummaryRequests.has(id)) {
        return collectionSummaryRequests.get(id) ?? null
      }

      const request = (async () => {
        try {
          const params = new URLSearchParams({
            id: String(id),
            summary: 'true',
            includeImages: 'true',
            imageLimit: '1',
            counts: 'true',
            maturity,
            privacy,
            showMature: maturity === 'safe' ? 'false' : 'true',
          })
          const response = await performFetch<ApiCollection[]>(
            `/api/art/collection?${params.toString()}`,
          )
          const first = Array.isArray(response.data) ? response.data[0] : null

          if (!response.success || !first) {
            throw new Error(
              response.message || `Failed to load collection #${id} summary.`,
            )
          }

          const normalized = normalizeCollection(first)
          collectionSummaries.value = {
            ...collectionSummaries.value,
            [id]: normalized,
          }

          const images = normalized.ArtImages ?? []
          if (images.length) artStore.addOrUpdateArtImages(images)

          return normalized
        } catch (error) {
          handleError(error, `loading collection #${id} summary`)
          return null
        } finally {
          collectionSummaryRequests.delete(id)
        }
      })()

      collectionSummaryRequests.set(id, request)
      return request
    }

    async function fetchUnsortedSummary(
      force = false,
      maturity: GalleryMaturityFilter = 'all',
      privacy: GalleryPrivacyFilter = 'public',
    ): Promise<UnsortedArtSummary> {
      const scopeKey = `${privacy}:${maturity}`
      if (!force && unsortedSummaryScopeKey === scopeKey) {
        return unsortedSummary.value
      }
      if (!force && unsortedSummaryRequest) return unsortedSummaryRequest

      unsortedSummaryRequest = (async () => {
        try {
          const response = await performFetch<UnsortedArtSummary>(
            `/api/art/collection/unsorted?summary=true&${browseQuery(
              maturity,
              privacy,
            )}`,
          )

          if (!response.success || !response.data) {
            throw new Error(
              response.message || 'Failed to load unsorted art summary.',
            )
          }

          unsortedSummary.value = {
            count: Number(response.data.count) || 0,
            totalCount: Number(response.data.totalCount) || 0,
            previewArtImage: response.data.previewArtImage ?? null,
          }
          unsortedSummaryScopeKey = scopeKey
          unsortedSummaryLoaded.value = true

          if (unsortedSummary.value.previewArtImage) {
            artStore.addOrUpdateArtImages([
              unsortedSummary.value.previewArtImage,
            ])
          }

          return unsortedSummary.value
        } catch (error) {
          handleError(error, 'loading unsorted art summary')
          return unsortedSummary.value
        } finally {
          unsortedSummaryRequest = null
        }
      })()

      return unsortedSummaryRequest
    }

    async function fetchUnsortedImages(
      force = false,
      maturity: GalleryMaturityFilter = 'all',
      privacy: GalleryPrivacyFilter = 'public',
    ): Promise<ArtImage[]> {
      const scopeKey = `${privacy}:${maturity}`
      if (!force && unsortedImagesScopeKey === scopeKey) {
        return unsortedImages.value
      }
      if (!force && unsortedImagesRequest) return unsortedImagesRequest

      unsortedImagesRequest = (async () => {
        try {
          const response = await performFetch<ArtImage[]>(
            `/api/art/collection/unsorted?${browseQuery(maturity, privacy)}`,
          )

          if (!response.success || !Array.isArray(response.data)) {
            throw new Error(
              response.message || 'Failed to load unsorted art images.',
            )
          }

          unsortedImages.value = response.data
          unsortedImagesScopeKey = scopeKey
          if (response.data.length) artStore.addOrUpdateArtImages(response.data)
          return unsortedImages.value
        } catch (error) {
          handleError(error, 'loading unsorted art images')
          return unsortedImages.value
        } finally {
          unsortedImagesRequest = null
        }
      })()

      return unsortedImagesRequest
    }

    function invalidateCollection(collectionId?: number): void {
      if (typeof collectionId === 'number') {
        loadedCollectionIds.delete(collectionId)
        collectionSummaries.value = Object.fromEntries(
          Object.entries(collectionSummaries.value).filter(
            ([key]) => Number(key) !== collectionId,
          ),
        )
        const next: Record<number, BrowseArtCollection> = {}
        for (const [key, value] of Object.entries(collectionDetails.value)) {
          const id = Number(key)
          if (id !== collectionId) next[id] = value
        }
        collectionDetails.value = next
        return
      }

      loadedCollectionIds.clear()
      collectionDetails.value = {}
      collectionSummaries.value = {}
    }

    function invalidateUnsorted(): void {
      unsortedSummaryScopeKey = ''
      unsortedImagesScopeKey = ''
      unsortedSummaryLoaded.value = false
      unsortedSummary.value = { ...EMPTY_UNSORTED_SUMMARY }
      unsortedImages.value = []
    }

    function invalidateAll(): void {
      invalidateCollection()
      invalidateUnsorted()
    }

    return {
      collectionDetails,
      collectionSummaries,
      unsortedSummary,
      unsortedSummaryLoaded,
      unsortedImages,
      fetchCollectionDetail,
      fetchCollectionSummary,
      fetchUnsortedSummary,
      fetchUnsortedImages,
      invalidateCollection,
      invalidateUnsorted,
      invalidateAll,
    }
  },
)
