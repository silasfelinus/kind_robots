import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch } from '@/stores/utils'

export type ModelDownloadStatus = 'PENDING' | 'CLAIMED' | 'DONE' | 'FAILED'

export type ModelDownloadRecord = {
  id: number
  createdAt: string
  updatedAt: string | null
  status: ModelDownloadStatus
  resourceType: string
  source: string
  fileName: string | null
  label: string | null
  civitaiModelVersionId: number | null
  isMature: boolean
  attempts: number
  claimedAt: string | null
  resourceId: number | null
  error: string | null
}

type DownloadCounts = Record<ModelDownloadStatus, number>

type DownloadPage = {
  active: ModelDownloadRecord[]
  history: ModelDownloadRecord[]
  counts: DownloadCounts
  nextBefore: number | null
  activeLimited: boolean
}

const emptyCounts = (): DownloadCounts => ({
  PENDING: 0,
  CLAIMED: 0,
  DONE: 0,
  FAILED: 0,
})

export const useResourceDownloadsStore = defineStore(
  'resourceDownloads',
  () => {
    const active = ref<ModelDownloadRecord[]>([])
    const history = ref<ModelDownloadRecord[]>([])
    const counts = ref<DownloadCounts>(emptyCounts())
    const nextBefore = ref<number | null>(null)
    const activeLimited = ref(false)
    const hasLoadedOlder = ref(false)
    const loading = ref(false)
    const loadingMore = ref(false)
    const retryingId = ref<number | null>(null)
    const deletingId = ref<number | null>(null)
    const bulkBusy = ref(false)
    const error = ref('')
    const notice = ref('')
    const updatedAt = ref<Date | null>(null)

    const rows = computed(() => [...active.value, ...history.value])

    async function refresh(reset = false): Promise<void> {
      if (loading.value || loadingMore.value) return
      loading.value = true
      error.value = ''
      try {
        const response = await performFetch<DownloadPage>(
          '/api/lora/download',
          {},
          1,
          30_000,
        )
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Could not load model downloads.')
        }
        const data = response.data
        active.value = data.active
        counts.value = data.counts
        activeLimited.value = data.activeLimited
        const activeIds = new Set(data.active.map((row) => row.id))
        const merged = reset
          ? data.history
          : [...data.history, ...history.value]
        history.value = Array.from(
          new Map(merged.map((row) => [row.id, row])).values(),
        )
          .filter((row) => !activeIds.has(row.id))
          .sort((a, b) => b.id - a.id)
        if (reset) hasLoadedOlder.value = false
        if (!hasLoadedOlder.value) nextBefore.value = data.nextBefore
        updatedAt.value = new Date()
      } catch (caught) {
        error.value =
          caught instanceof Error
            ? caught.message
            : 'Unable to refresh downloads.'
      } finally {
        loading.value = false
      }
    }

    async function loadMore(): Promise<void> {
      if (loading.value || loadingMore.value || nextBefore.value === null)
        return
      loadingMore.value = true
      error.value = ''
      try {
        const response = await performFetch<DownloadPage>(
          `/api/lora/download?before=${nextBefore.value}`,
        )
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Could not load older downloads.')
        }
        const activeIds = new Set(active.value.map((row) => row.id))
        const merged = [...history.value, ...response.data.history]
        history.value = Array.from(
          new Map(merged.map((row) => [row.id, row])).values(),
        )
          .filter((row) => !activeIds.has(row.id))
          .sort((a, b) => b.id - a.id)
        nextBefore.value = response.data.nextBefore
        hasLoadedOlder.value = true
      } catch (caught) {
        error.value =
          caught instanceof Error ? caught.message : 'Unable to load history.'
      } finally {
        loadingMore.value = false
      }
    }

    async function retry(id: number): Promise<boolean> {
      if (retryingId.value !== null) return false
      retryingId.value = id
      error.value = ''
      notice.value = ''
      try {
        const response = await performFetch<{ id: number; status: 'PENDING' }>(
          `/api/lora/download/${id}/retry`,
          { method: 'POST' },
        )
        if (!response.success) {
          throw new Error(response.message || 'Could not retry this download.')
        }
        history.value = history.value.filter((row) => row.id !== id)
        notice.value = `Download #${id} requeued.`
        await refresh()
        return true
      } catch (caught) {
        error.value =
          caught instanceof Error ? caught.message : 'Unable to retry download.'
        return false
      } finally {
        retryingId.value = null
      }
    }


    async function deleteRecord(id: number): Promise<boolean> {
      if (deletingId.value !== null || bulkBusy.value) return false
      deletingId.value = id
      error.value = ''
      notice.value = ''
      try {
        const response = await performFetch<{ id: number }>(
          `/api/lora/download/${id}`,
          { method: 'DELETE' },
        )
        if (!response.success) {
          throw new Error(response.message || 'Could not delete history entry.')
        }
        notice.value = `Download #${id} removed from history; model files untouched.`
        await refresh(true)
        return true
      } catch (caught) {
        error.value =
          caught instanceof Error ? caught.message : 'Unable to delete entry.'
        return false
      } finally {
        deletingId.value = null
      }
    }

    async function bulkFailed(
      operation: 'retry' | 'delete',
      ids: number[],
    ): Promise<boolean> {
      if (bulkBusy.value || retryingId.value !== null || deletingId.value !== null)
        return false
      if (ids.length === 0 || ids.length > 50) return false
      bulkBusy.value = true
      error.value = ''
      notice.value = ''
      try {
        const response = await performFetch<{
          changed: number
          skipped: number
          failed?: { id: number; reason: string }[]
        }>('/api/lora/download/failed', {
          method: 'POST',
          body: JSON.stringify({ operation, ids }),
        })
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Could not update failed downloads.')
        }
        const { changed, skipped, failed } = response.data
        const action = operation === 'retry' ? 'requeued' : 'cleared'
        notice.value = `${changed} failed downloads ${action}.${
          skipped ? ` ${skipped} skipped because their status changed or a model is already queued.` : ''
        }`
        if (failed?.length) {
          error.value = failed.map((item) => `#${item.id}: ${item.reason}`).join(' | ')
        }
        await refresh(true)
        return true
      } catch (caught) {
        error.value =
          caught instanceof Error ? caught.message : 'Bulk update failed.'
        return false
      } finally {
        bulkBusy.value = false
      }
    }

    return {
      active,
      history,
      rows,
      counts,
      nextBefore,
      activeLimited,
      loading,
      loadingMore,
      retryingId,
      deletingId,
      bulkBusy,
      error,
      notice,
      updatedAt,
      refresh,
      loadMore,
      retry,
      deleteRecord,
      bulkFailed,
    }
  },
)
