import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useButterflyGalleryStore } from '@/stores/butterflyGalleryStore'
import {
  executeButterflyBatch,
  previewButterflyBatch,
  type ButterflyBatchPreview,
  type ButterflyBatchResult,
} from '@/stores/helpers/butterflyGalleryBatch'

export type PreparedButterflyBatch = {
  binId: string
  label: string
  preview: ButterflyBatchPreview
}

export const useButterflyGalleryBatchStore = defineStore(
  'butterflyGalleryBatchStore',
  () => {
    const gallery = useButterflyGalleryStore()
    const prepared = ref<PreparedButterflyBatch | null>(null)
    const lastResult = ref<ButterflyBatchResult | null>(null)
    const running = ref(false)

    const hasSelection = computed(() => gallery.batchSelectedCount > 0)

    function prepareBinBatch(binId: string): PreparedButterflyBatch | null {
      const bin = gallery.binById(binId)
      if (!bin || !gallery.batchSelectedIds.length) {
        prepared.value = null
        return null
      }

      const actions = 'actions' in bin && Array.isArray(bin.actions) ? bin.actions : []
      const preview = previewButterflyBatch(gallery.batchSelectedIds, {
        destructive: bin.kind === 'trash',
        expensive: actions.length > 0,
      })

      prepared.value = { binId: bin.id, label: bin.label, preview }
      return prepared.value
    }

    function cancelPreparedBatch(): void {
      prepared.value = null
    }

    async function executePreparedBatch(
      confirmed = false,
    ): Promise<ButterflyBatchResult | null> {
      const batch = prepared.value
      if (!batch || running.value) return null
      if (batch.preview.requiresConfirmation && !confirmed) return null

      const entryIds = [...gallery.batchSelectedIds]
      running.value = true
      try {
        const result = await executeButterflyBatch(entryIds, async (entryId) => {
          const outcome = await gallery.dropOnBin(batch.binId, entryId)
          if (!outcome && gallery.status === 'error') gallery.clearError()
          return outcome !== null
        })

        lastResult.value = result
        gallery.batchSelectedIds = gallery.batchSelectedIds.filter(
          (entryId) => !result.succeededIds.includes(entryId),
        )
        prepared.value = null
        return result
      } finally {
        running.value = false
      }
    }

    return {
      prepared,
      lastResult,
      running,
      hasSelection,
      prepareBinBatch,
      cancelPreparedBatch,
      executePreparedBatch,
    }
  },
)
