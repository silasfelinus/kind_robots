import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useButterflyGalleryStore } from '@/stores/butterflyGalleryStore'
import {
  describeButterflyBatchEdit,
  executeButterflyBatch,
  previewButterflyBatch,
  type ButterflyBatchEdit,
  type ButterflyBatchPreview,
  type ButterflyBatchResult,
} from '@/stores/helpers/butterflyGalleryBatch'

export type PreparedButterflyBatch = {
  label: string
  preview: ButterflyBatchPreview
} & (
  { kind: 'bin'; binId: string } | { kind: 'edit'; edit: ButterflyBatchEdit }
)

function clearsSelection(edit: ButterflyBatchEdit): boolean {
  return (
    edit.type === 'move' || edit.type === 'trash' || edit.type === 'restore'
  )
}

export const useButterflyGalleryBatchStore = defineStore(
  'butterflyGalleryBatchStore',
  () => {
    const gallery = useButterflyGalleryStore()
    const prepared = ref<PreparedButterflyBatch | null>(null)
    const lastResult = ref<ButterflyBatchResult | null>(null)
    const lastLabel = ref('')
    const running = ref(false)

    const hasSelection = computed(() => gallery.batchSelectedCount > 0)

    function prepareBinBatch(binId: string): PreparedButterflyBatch | null {
      const bin = gallery.binById(binId)
      if (!bin || !gallery.batchSelectedIds.length) {
        prepared.value = null
        return null
      }

      const actions =
        'actions' in bin && Array.isArray(bin.actions) ? bin.actions : []
      const preview = previewButterflyBatch(gallery.batchSelectedIds, {
        destructive: bin.kind === 'trash',
        expensive: actions.length > 0,
      })

      prepared.value = { kind: 'bin', binId: bin.id, label: bin.label, preview }
      return prepared.value
    }

    /** Stages a batch edit over the current selection. Edits that move
     * files or trash artwork wait for confirmation; the rest run at once. */
    async function prepareEdit(
      edit: ButterflyBatchEdit,
    ): Promise<PreparedButterflyBatch | null> {
      if (!gallery.batchSelectedIds.length) {
        prepared.value = null
        return null
      }
      const preview = previewButterflyBatch(gallery.batchSelectedIds, {
        destructive: edit.type === 'trash' || edit.type === 'move',
      })
      prepared.value = {
        kind: 'edit',
        edit,
        label: describeButterflyBatchEdit(edit),
        preview,
      }
      if (!preview.requiresConfirmation) await executePreparedBatch(false)
      return prepared.value
    }

    function cancelPreparedBatch(): void {
      prepared.value = null
    }

    async function runEdit(
      edit: ButterflyBatchEdit,
      entryIds: number[],
    ): Promise<ButterflyBatchResult> {
      if (edit.type === 'move') {
        const moved = await gallery.moveEntriesToFolder(entryIds, edit.folder)
        return {
          attempted: entryIds.length,
          succeededIds: moved.moved.map((entry) => entry.id),
          failures: moved.failures.map((failure) => ({
            entryId: failure.id,
            message: failure.message,
          })),
        }
      }

      const created =
        edit.type === 'new-collection'
          ? await gallery.createCollection(edit.label)
          : undefined
      if (created) void gallery.loadCatalog()
      const collection =
        created?.slug ?? (edit.type === 'add-collection' ? edit.collection : '')

      return executeButterflyBatch(entryIds, async (entryId) => {
        let ok: boolean
        switch (edit.type) {
          case 'rating':
            ok = await gallery.setRating(entryId, edit.rating)
            break
          case 'add-collection':
          case 'new-collection':
            ok = await gallery.addToCollection(entryId, collection, created)
            break
          case 'remove-collection':
            ok = await gallery.removeFromCollection(entryId, edit.collection)
            break
          case 'trash':
            ok = await gallery.trashEntry(entryId)
            break
          case 'restore':
            ok = await gallery.restoreEntry(entryId)
            break
        }
        if (!ok && gallery.status === 'error') {
          const message = gallery.errorMessage
          gallery.clearError()
          throw new Error(message || 'Action was not applied.')
        }
        return ok
      })
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
        const result =
          batch.kind === 'bin'
            ? await executeButterflyBatch(entryIds, async (entryId) => {
                const outcome = await gallery.dropOnBin(batch.binId, entryId)
                if (!outcome && gallery.status === 'error') gallery.clearError()
                return outcome !== null
              })
            : await runEdit(batch.edit, entryIds)

        lastResult.value = result
        lastLabel.value = batch.label
        if (batch.kind === 'bin' || clearsSelection(batch.edit))
          gallery.batchSelectedIds = gallery.batchSelectedIds.filter(
            (entryId) => !result.succeededIds.includes(entryId),
          )
        prepared.value = null
        return result
      } finally {
        running.value = false
      }
    }

    function dismissResult(): void {
      lastResult.value = null
    }

    return {
      prepared,
      lastResult,
      lastLabel,
      running,
      hasSelection,
      prepareBinBatch,
      prepareEdit,
      cancelPreparedBatch,
      executePreparedBatch,
      dismissResult,
    }
  },
)
