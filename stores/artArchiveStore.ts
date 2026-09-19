import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from '@/stores/utils'

export type ArchiveEntrySummary = {
  id: number
  relativePath: string
  parentFolder: string | null
  artImageId: number | null
  imagePath: string | null
  thumbnailPath: string | null
  folderCollectionId: number | null
  processState: string
  matchState: string
  resourceMatchLocked: boolean
  rating: number | null
  isActive: boolean
}

export type ArchiveEntryDetail = {
  entry: Omit<ArchiveEntrySummary, 'imagePath' | 'thumbnailPath'> & {
    imagePath: string | null
    thumbnailPath: string | null
    extractedMetadata: unknown
    matchSummary: unknown
  }
  artImage: null | {
    id: number
    fileName: string | null
    path: string | null
    promptString: string | null
    negativePrompt: string | null
    checkpointResourceId: number | null
    seed: string | number | null
    cfg: number | null
    sampler: string | null
    steps: number | null
  }
  folderCollection: null | { id: number; label: string | null; parentFolder: string | null }
}

export type ArchiveActionPresetSummary = {
  id: number
  label: string
  actionType: string
  modifiers: unknown
  isActive: boolean
}

type ArchiveFilters = { search: string; folderCollectionId: string; processState: string; matchState: string; rating: string; includeInactive: boolean }
type ListPayload = { entries: ArchiveEntrySummary[]; page: number; pageSize: number; total: number }
type ActionPayload = { alreadyQuarantined?: boolean; alreadyActive?: boolean }
type BatchResult = { attempted: number; succeeded: number; failed: Array<{ id: number; message: string }> }
export type ArchiveEntryJobStatus = { jobId: number; status: string; archivePresetId: number | null; updatedAt: string | null; error: string | null }
const POLLABLE_JOB_STATUSES = new Set(['PENDING', 'RUNNING'])

export const useArtArchiveStore = defineStore('artArchiveStore', () => {
  const entries = ref<ArchiveEntrySummary[]>([])
  const detail = ref<ArchiveEntryDetail | null>(null)
  const presets = ref<ArchiveActionPresetSummary[]>([])
  const selectedIds = ref<number[]>([])
  const batchResult = ref<BatchResult | null>(null)
  const entryJobs = ref<Record<number, ArchiveEntryJobStatus>>({})
  const loading = ref(false)
  const detailLoading = ref(false)
  const actionPending = ref(false)
  const error = ref('')
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(60)
  const filters = ref<ArchiveFilters>({ search: '', folderCollectionId: '', processState: '', matchState: '', rating: '', includeInactive: false })

  const folders = computed(() => {
    const byId = new Map<number, string>()
    for (const entry of entries.value) {
      if (entry.folderCollectionId && entry.parentFolder) byId.set(entry.folderCollectionId, entry.parentFolder)
    }
    return [...byId.entries()].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label))
  })
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
  const selectedCount = computed(() => selectedIds.value.length)

  async function fetchEntries(resetPage = false) {
    if (resetPage) page.value = 1
    loading.value = true
    error.value = ''
    const params = new URLSearchParams({ page: String(page.value), pageSize: String(pageSize.value) })
    for (const [key, value] of Object.entries(filters.value)) if (value) params.set(key, String(value))
    const response = await performFetch<ListPayload>(`/api/admin/art-archive/entries?${params}`)
    if (response.success && response.data) {
      entries.value = response.data.entries
      total.value = response.data.total
      page.value = response.data.page
      pageSize.value = response.data.pageSize
      const visibleIds = new Set(entries.value.map((entry) => entry.id))
      selectedIds.value = selectedIds.value.filter((id) => visibleIds.has(id))
      void fetchEntryJobs(entries.value.map((entry) => entry.id))
    } else error.value = response.message || 'Could not load the archive.'
    loading.value = false
  }

  /** art-archive/t-028: backfills any recent preset-job history for the
   * given entries (e.g. after a page load or a refresh), keyed by
   * archiveEntryId as tagged in buildArchiveEnqueuePayload.ts. */
  async function fetchEntryJobs(ids: number[]) {
    const uniqueIds = [...new Set(ids)].filter((id) => Number.isInteger(id) && id > 0)
    if (!uniqueIds.length) return
    const response = await performFetch<{ jobs: Record<string, ArchiveEntryJobStatus> }>(
      `/api/admin/art-archive/entries/jobs?ids=${uniqueIds.join(',')}`,
    )
    if (response.success && response.data) {
      const next = { ...entryJobs.value }
      for (const [idKey, status] of Object.entries(response.data.jobs)) next[Number(idKey)] = status
      entryJobs.value = next
    }
  }

  /** Re-polls only the jobs still in flight, so the board reflects DONE/FAILED
   * without hammering the endpoint for jobs that already settled. */
  function refreshPendingEntryJobs() {
    const pendingIds = Object.entries(entryJobs.value)
      .filter(([, job]) => POLLABLE_JOB_STATUSES.has(job.status))
      .map(([id]) => Number(id))
    if (pendingIds.length) return fetchEntryJobs(pendingIds)
    return Promise.resolve()
  }

  async function fetchPresets() {
    const response = await performFetch<ArchiveActionPresetSummary[]>('/api/admin/art-archive/presets')
    if (response.success && response.data) presets.value = response.data
    else error.value = response.message || 'Could not load archive action presets.'
  }

  async function selectEntry(id: number) {
    detailLoading.value = true
    error.value = ''
    const response = await performFetch<ArchiveEntryDetail>(`/api/admin/art-archive/entries/${id}`)
    if (response.success && response.data) detail.value = response.data
    else error.value = response.message || 'Could not load archive entry details.'
    detailLoading.value = false
  }

  function clearSelection() { detail.value = null }
  function toggleBatchSelection(id: number) {
    selectedIds.value = selectedIds.value.includes(id)
      ? selectedIds.value.filter((selectedId) => selectedId !== id)
      : [...selectedIds.value, id]
    batchResult.value = null
  }
  function clearBatchSelection() { selectedIds.value = []; batchResult.value = null }

  async function runEntryAction(id: number, path: 'quarantine' | 'restore'): Promise<boolean> {
    actionPending.value = true
    error.value = ''
    const response = await performFetch<ActionPayload>(`/api/admin/art-archive/entries/${id}/${path}`, { method: 'POST' })
    if (response.success) {
      if (detail.value?.entry.id === id) clearSelection()
      await fetchEntries()
    } else {
      error.value = response.message || `Could not ${path} archive entry #${id}.`
    }
    actionPending.value = false
    return response.success
  }

  function quarantineEntry(id: number) { return runEntryAction(id, 'quarantine') }
  function restoreEntry(id: number) { return runEntryAction(id, 'restore') }

  async function rateEntry(id: number, rating: number | null): Promise<boolean> {
    actionPending.value = true
    error.value = ''
    const response = await performFetch<{ id: number; rating: number | null }>(
      `/api/admin/art-archive/entries/${id}/rate`,
      { method: 'PATCH', body: JSON.stringify({ rating }) },
    )
    if (response.success && response.data) {
      const row = entries.value.find((entry) => entry.id === id)
      if (row) row.rating = response.data.rating
      if (detail.value?.entry.id === id) detail.value.entry.rating = response.data.rating
    } else {
      error.value = response.message || `Could not rate archive entry #${id}.`
    }
    actionPending.value = false
    return response.success
  }

  async function runBatch(ids: number[], action: (id: number) => Promise<boolean>, failureMessage: string): Promise<BatchResult> {
    const failed: BatchResult['failed'] = []
    let succeeded = 0
    for (const id of [...new Set(ids)]) {
      const ok = await action(id)
      if (ok) succeeded += 1
      else failed.push({ id, message: error.value || failureMessage })
    }
    const result = { attempted: [...new Set(ids)].length, succeeded, failed }
    batchResult.value = result
    selectedIds.value = failed.map((item) => item.id)
    return result
  }

  function rateSelected(rating: number) {
    return runBatch(selectedIds.value, (id) => rateEntry(id, rating), 'Rating failed.')
  }

  /** art-archive/t-016: queues a durable ArtJob per selected entry from its
   * imported ArtImage plus the chosen preset. Never touches the entry's file
   * or isActive state -- only the existing quarantine action does that, once
   * an admin has reviewed the resulting render. */
  async function applyPresetEntry(id: number, presetId: number): Promise<boolean> {
    actionPending.value = true
    error.value = ''
    const response = await performFetch<{ jobId: number; status: string; actionType: string }>(
      `/api/admin/art-archive/entries/${id}/enqueue`,
      { method: 'POST', body: JSON.stringify({ presetId }) },
    )
    if (response.success && response.data) {
      entryJobs.value = {
        ...entryJobs.value,
        [id]: { jobId: response.data.jobId, status: response.data.status, archivePresetId: presetId, updatedAt: null, error: null },
      }
    } else {
      error.value = response.message || `Could not queue a job for archive entry #${id}.`
    }
    actionPending.value = false
    return response.success
  }

  function applyPresetToSelected(presetId: number) {
    return runBatch(selectedIds.value, (id) => applyPresetEntry(id, presetId), 'Queueing failed.')
  }

  async function quarantineSelected() {
    const ids = [...selectedIds.value]
    const failed: BatchResult['failed'] = []
    let succeeded = 0
    actionPending.value = true
    error.value = ''
    for (const id of ids) {
      const response = await performFetch<ActionPayload>(`/api/admin/art-archive/entries/${id}/quarantine`, { method: 'POST' })
      if (response.success) succeeded += 1
      else failed.push({ id, message: response.message || 'Delete failed.' })
    }
    const result = { attempted: ids.length, succeeded, failed }
    batchResult.value = result
    selectedIds.value = failed.map((item) => item.id)
    await fetchEntries()
    actionPending.value = false
    return result
  }

  return { entries, detail, presets, selectedIds, selectedCount, batchResult, entryJobs, loading, detailLoading, actionPending, error, total, page, pageSize, pageCount, filters, folders, fetchEntries, fetchPresets, selectEntry, clearSelection, toggleBatchSelection, clearBatchSelection, quarantineEntry, restoreEntry, rateEntry, rateSelected, quarantineSelected, applyPresetToSelected, fetchEntryJobs, refreshPendingEntryJobs }
})