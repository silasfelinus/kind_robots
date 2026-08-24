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

function matureQuery(showMature: boolean): string {
  return showMature ? '&showMature=true' : ''
}

export const useArtCollectionBrowseStore = defineStore(
  'artCollectionBrowseStore',
  () => {
    const collectionDetails = ref<Record<number, BrowseArtCollection>>({})
    const unsortedSummary = ref<UnsortedArtSummary>({
      ...EMPTY_UNSORTED_SUMMARY,
    })
    const unsortedImages = ref<ArtImage[]>([])

    const loadedCollectionIds = new Set<number>()
    const collectionRequests = new Map<
      number,
      Promise<BrowseArtCollection | null>
    >()
    let unsortedSummaryRequest: Promise<UnsortedArtSummary> | null = null
    let unsortedImagesRequest: Promise<ArtImage[]> | null = null
    let unsortedSummaryMatureMode: boolean | null = null
    let unsortedImagesMatureMode: boolean | null = null

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

    async function fetchUnsortedSummary(
      force = false,
      showMature = false,
    ): Promise<UnsortedArtSummary> {
      if (!force && unsortedSummaryMatureMode === showMature) {
        return unsortedSummary.value
      }
      if (!force && unsortedSummaryRequest) return unsortedSummaryRequest

      unsortedSummaryRequest = (async () => {
        try {
          const response = await performFetch<UnsortedArtSummary>(
            `/api/art/collection/unsorted?summary=true${matureQuery(showMature)}`,
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
          unsortedSummaryMatureMode = showMature

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
      showMature = false,
    ): Promise<ArtImage[]> {
      if (!force && unsortedImagesMatureMode === showMature) {
        return unsortedImages.value
      }
      if (!force && unsortedImagesRequest) return unsortedImagesRequest

      unsortedImagesRequest = (async () => {
        try {
          const suffix = showMature ? '?showMature=true' : ''
          const response = await performFetch<ArtImage[]>(
            `/api/art/collection/unsorted${suffix}`,
          )

          if (!response.success || !Array.isArray(response.data)) {
            throw new Error(
              response.message || 'Failed to load unsorted art images.',
            )
          }

          unsortedImages.value = response.data
          unsortedImagesMatureMode = showMature
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
    }

    function invalidateUnsorted(): void {
      unsortedSummaryMatureMode = null
      unsortedImagesMatureMode = null
      unsortedSummary.value = { ...EMPTY_UNSORTED_SUMMARY }
      unsortedImages.value = []
    }

    function invalidateAll(): void {
      invalidateCollection()
      invalidateUnsorted()
    }

    return {
      collectionDetails,
      unsortedSummary,
      unsortedImages,
      fetchCollectionDetail,
      fetchUnsortedSummary,
      fetchUnsortedImages,
      invalidateCollection,
      invalidateUnsorted,
      invalidateAll,
    }
  },
)
