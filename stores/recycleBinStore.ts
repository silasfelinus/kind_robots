// /stores/recycleBinStore.ts
//
// The Gallery's Recycle Bin: images and folders that were deleted (moved to
// isActive = false by DELETE /api/art/image/:id and /api/art/collection/:id).
// From here they are restored, or purged for good with Delete forever.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import { handleError, performFetch } from '@/stores/utils'

export type RecycleBinImage = ArtImage & { thumbnailUrl: string }

export type RecycleBinCollection = {
  id: number
  updatedAt: string | Date | null
  userId: number | null
  label: string | null
  slug: string | null
  isMature: boolean
  isPublic: boolean
  artImageCount: number
}

export type RecycleBinSelection = {
  imageIds?: number[]
  collectionIds?: number[]
}

type RecycleBinItemResult = {
  kind: 'image' | 'collection'
  id: number
  success: boolean
  message: string
}

type RecycleBinListing = {
  images: RecycleBinImage[]
  imageCount: number
  collections: RecycleBinCollection[]
}

const BIN_ACTION_TIMEOUT_MS = 120_000
const MAX_IDS = 200

export const useRecycleBinStore = defineStore('recycleBinStore', () => {
  const images = ref<RecycleBinImage[]>([])
  const imageCount = ref(0)
  const collections = ref<RecycleBinCollection[]>([])
  const loaded = ref(false)
  const isLoading = ref(false)
  const isWorking = ref(false)
  const errorMessage = ref('')
  let pending: Promise<boolean> | null = null

  const itemCount = computed(() => imageCount.value + collections.value.length)

  async function fetchBin(force = false): Promise<boolean> {
    if (loaded.value && !force) return true
    if (pending) return pending

    pending = (async () => {
      isLoading.value = true
      try {
        const response = await performFetch<RecycleBinListing>(
          '/api/art/recycle-bin',
        )
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to load the Recycle Bin.')
        }
        images.value = response.data.images
        imageCount.value = response.data.imageCount
        collections.value = response.data.collections
        loaded.value = true
        errorMessage.value = ''
        return true
      } catch (error) {
        errorMessage.value =
          error instanceof Error
            ? error.message
            : 'Failed to load the Recycle Bin.'
        handleError(error, 'loading the Recycle Bin')
        return false
      } finally {
        isLoading.value = false
        pending = null
      }
    })()
    return pending
  }

  async function postChunk(
    action: 'restore' | 'purge',
    imageIds: number[],
    collectionIds: number[],
  ): Promise<RecycleBinItemResult[]> {
    const response = await performFetch<{ results: RecycleBinItemResult[] }>(
      `/api/art/recycle-bin/${action}`,
      {
        method: 'POST',
        body: JSON.stringify({ imageIds, collectionIds }),
      },
      1,
      BIN_ACTION_TIMEOUT_MS,
    )
    if (!response.data?.results) {
      throw new Error(response.message || `Recycle Bin ${action} failed.`)
    }
    return response.data.results
  }

  async function runAction(
    action: 'restore' | 'purge',
    selection: RecycleBinSelection,
  ): Promise<{ success: boolean; message: string }> {
    isWorking.value = true
    try {
      const collectionIds = selection.collectionIds ?? []
      const imageIds = selection.imageIds ?? []
      const results: RecycleBinItemResult[] = []
      for (let start = 0; start < collectionIds.length; start += MAX_IDS) {
        results.push(
          ...(await postChunk(
            action,
            [],
            collectionIds.slice(start, start + MAX_IDS),
          )),
        )
      }
      for (let start = 0; start < imageIds.length; start += MAX_IDS) {
        results.push(
          ...(await postChunk(
            action,
            imageIds.slice(start, start + MAX_IDS),
            [],
          )),
        )
      }
      const failures = results.filter((result) => !result.success)
      const verb = action === 'restore' ? 'Restored' : 'Deleted forever'
      await fetchBin(true)
      return {
        success: failures.length === 0,
        message: failures.length
          ? `${verb} ${results.length - failures.length} of ${results.length} item(s). ${failures[0]?.message ?? ''}`.trim()
          : `${verb} ${results.length} item(s).`,
      }
    } catch (error) {
      handleError(error, `running Recycle Bin ${action}`)
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : `Recycle Bin ${action} failed.`,
      }
    } finally {
      isWorking.value = false
    }
  }

  function restore(selection: RecycleBinSelection) {
    return runAction('restore', selection)
  }

  function purge(selection: RecycleBinSelection) {
    return runAction('purge', selection)
  }

  function invalidate(): void {
    loaded.value = false
  }

  return {
    images,
    imageCount,
    collections,
    loaded,
    isLoading,
    isWorking,
    errorMessage,
    itemCount,
    fetchBin,
    restore,
    purge,
    invalidate,
  }
})
