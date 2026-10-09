import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from '~/stores/utils'
import {
  ZUZU_ASSET_PAGE_SIZE,
  type ZuzuAsset,
  type ZuzuProject,
  type ZuzuWorldPage,
} from '~/utils/zuzuWorld'

export const useZuzuWorldStore = defineStore('zuzuWorld', () => {
  const items = ref<ZuzuAsset[]>([])
  const projects = ref<ZuzuProject[]>([])
  const total = ref(0)
  const recordedCount = ref(0)
  const ledgerCount = ref(0)
  const page = ref(1)
  const search = ref('')
  const projectFilter = ref('')
  const kindFilter = ref('all')
  const selectedIds = ref<number[]>([])
  const focusId = ref<number | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const requesting = ref(false)
  const error = ref('')
  const notice = ref('')
  let requestSerial = 0
  let searchTimer: ReturnType<typeof setTimeout> | null = null

  const focused = computed(() =>
    items.value.find((item) => item.id === focusId.value) ?? null,
  )
  const selectedItems = computed(() =>
    items.value.filter((item) => selectedIds.value.includes(item.id)),
  )
  const pageCount = computed(() =>
    Math.max(1, Math.ceil(total.value / ZUZU_ASSET_PAGE_SIZE)),
  )

  async function load(): Promise<void> {
    const serial = ++requestSerial
    loading.value = true
    error.value = ''
    const params = new URLSearchParams({
      page: String(page.value),
      q: search.value,
      project: projectFilter.value,
      kind: kindFilter.value,
    })
    try {
      const result = await performFetch<ZuzuWorldPage>(
        `/api/worlds/zuzu?${params.toString()}`,
      )
      if (serial !== requestSerial) return
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Unable to load Zuzu artwork.')
      }
      items.value = result.data.items
      projects.value = result.data.projects
      total.value = result.data.total
      recordedCount.value = result.data.recordedCount
      ledgerCount.value = result.data.ledgerCount
      selectedIds.value = selectedIds.value.filter((id) =>
        result.data!.items.some((item) => item.id === id),
      )
      if (!items.value.some((item) => item.id === focusId.value)) {
        focusId.value = items.value[0]?.id ?? null
      }
    } catch (cause) {
      if (serial !== requestSerial) return
      error.value = cause instanceof Error
        ? cause.message : 'Unable to load the world library.'
      items.value = []
      total.value = 0
    } finally {
      if (serial === requestSerial) loading.value = false
    }
  }

  function setFilter(key: 'project' | 'kind', value: string): void {
    if (key === 'project') projectFilter.value = value
    else kindFilter.value = value
    page.value = 1
    void load()
  }

  function setSearch(value: string): void {
    search.value = value
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      page.value = 1
      void load()
    }, 320)
  }

  function goToPage(value: number): void {
    page.value = Math.max(1, Math.min(value, pageCount.value))
    selectedIds.value = []
    void load()
  }

  function focus(id: number): void {
    focusId.value = id
  }

  function toggle(id: number): void {
    selectedIds.value = selectedIds.value.includes(id)
      ? selectedIds.value.filter((value) => value !== id)
      : [...selectedIds.value, id]
  }

  function clearSelection(): void {
    selectedIds.value = []
  }

  async function assign(projectIds: number[], action: 'link' | 'unlink'): Promise<boolean> {
    const ids = selectedIds.value.length
      ? selectedIds.value
      : focused.value ? [focused.value.id] : []
    if (!ids.length || !projectIds.length) {
      error.value = 'Select artwork and at least one project.'
      return false
    }
    saving.value = true
    error.value = ''
    notice.value = ''
    try {
      const result = await performFetch<{ changed: number; references: number }>(
        '/api/worlds/zuzu/assign',
        {
          method: 'POST',
          body: JSON.stringify({ artImageIds: ids, projectIds, action }),
        },
      )
      if (!result.success) throw new Error(result.message || 'Could not save links.')
      notice.value = result.message || 'Project references saved.'
      await load()
      return true
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Could not update projects.'
      return false
    } finally {
      saving.value = false
    }
  }

  async function requestArtChange(projectSlug: string, direction: string): Promise<boolean> {
    const art = focused.value
    if (!art || !direction.trim()) {
      error.value = 'Choose an asset and describe the requested change.'
      return false
    }
    requesting.value = true
    error.value = ''
    notice.value = ''
    try {
      const result = await performFetch<{ path?: string }>(
        '/api/conductor/pitch',
        {
          method: 'POST',
          body: JSON.stringify({
            title: `Zuzu: revise art #${art.id}`,
            target: projectSlug || art.sourceProject,
            summary: `Requested update to existing ArtImage #${art.id} (${art.title}). Source: ${art.source}. Original must remain unchanged. Request: ${direction.trim()}`,
            why: 'Cross-project Zuzu World Studio visual curation request.',
            firstTask: `Inspect ArtImage #${art.id}, verify latest locked cast and VIDEO-GUARDRAILS; create derived ArtJob, present candidate privately for review in the target production. Do not overwrite canonical art or publish.`,
          }),
        },
      )
      if (!result.success) throw new Error(result.message || 'Could not submit request.')
      notice.value = 'Submitted as a Conductor pitch for review. Artwork remains unchanged.'
      return true
    } catch (cause) {
      error.value = cause instanceof Error
        ? cause.message : 'Unable to send the Conductor request.'
      return false
    } finally {
      requesting.value = false
    }
  }

  return {
    items, projects, total, recordedCount, ledgerCount, page, pageCount,
    search, projectFilter, kindFilter, selectedIds, selectedItems, focusId, focused,
    loading, saving, requesting, error, notice,
    load, setFilter, setSearch, goToPage, focus, toggle,
    clearSelection, assign, requestArtChange,
  }
})
