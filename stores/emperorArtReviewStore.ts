import { defineStore } from 'pinia'
import { ref } from 'vue'
import { performFetch } from '~/stores/utils'
import {
  ENDING_ART_IMAGE_IDS,
  type EmperorArtDeliveryTarget,
} from '~/utils/emperorOfDust/fortress/artDelivery'
import type { EndingId } from '~/utils/emperorOfDust/fortress/endings'

export type EmperorReviewImage = EmperorArtDeliveryTarget & {
  artJobId?: number
  status: 'ready' | 'unavailable'
  reason?: string
  width?: number
  height?: number
  sha256?: string
  preview?: string
}

export type EmperorDeliveryReceipt = EmperorArtDeliveryTarget & {
  artJobId?: number
  status: string
  url?: string
  sha256?: string
  reason?: string
}

export const ENDING_REVIEW_TARGETS: EmperorArtDeliveryTarget[] = (
  Object.entries(ENDING_ART_IMAGE_IDS) as [EndingId, number][]
).map(([id, artImageId]) => ({ asset: 'endings/' + id, artImageId }))

export const useEmperorArtReviewStore = defineStore(
  'emperorArtReview',
  () => {
    const images = ref<EmperorReviewImage[]>([])
    const delivery = ref<EmperorDeliveryReceipt[]>([])
    const loading = ref(false)
    const auditing = ref(false)
    const loaded = ref(false)
    const errorMessage = ref('')

    async function load(): Promise<void> {
      loading.value = true
      errorMessage.value = ''
      try {
        const result = await performFetch<{
          results: EmperorReviewImage[]
        }>(
          '/api/admin/emperor-of-dust/art-review',
          {
            method: 'POST',
            body: JSON.stringify({ targets: ENDING_REVIEW_TARGETS }),
          },
          1,
          60000,
        )
        if (!result.success || !result.data?.results) {
          throw new Error(result.message || 'Private art review failed.')
        }
        images.value = result.data.results
        loaded.value = true
      } catch (error) {
        errorMessage.value =
          error instanceof Error ? error.message : 'Private art review failed.'
      } finally {
        loading.value = false
      }
    }

    async function audit(): Promise<void> {
      auditing.value = true
      errorMessage.value = ''
      try {
        const result = await performFetch<{
          results: EmperorDeliveryReceipt[]
        }>(
          '/api/admin/emperor-of-dust/art-deliver',
          {
            method: 'POST',
            body: JSON.stringify({
              targets: ENDING_REVIEW_TARGETS,
              write: false,
            }),
          },
          1,
          120000,
        )
        if (!result.success || !result.data?.results) {
          throw new Error(result.message || 'Media-share dry-run failed.')
        }
        delivery.value = result.data.results
      } catch (error) {
        errorMessage.value =
          error instanceof Error ? error.message : 'Media-share dry-run failed.'
      } finally {
        auditing.value = false
      }
    }

    return {
      images,
      delivery,
      loading,
      auditing,
      loaded,
      errorMessage,
      load,
      audit,
    }
  },
)
