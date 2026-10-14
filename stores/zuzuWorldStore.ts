import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from '~/stores/utils'
import type { ZuzuResourceAuditReport } from '~/utils/zuzuResourceAudit'
import {
  ZUZU_ASSET_PAGE_SIZE,
  ZUZU_REPO_PAGE_SIZE,
  type ZuzuAsset,
  type ZuzuProject,
  type ZuzuRepoFileStatus,
  type ZuzuRepoMedia,
  type ZuzuRepoMediaPage,
  type ZuzuUsageRole,
  type ZuzuWorldPage,
} from '~/utils/zuzuWorld'

export type ZuzuUsageDraft = {
  role: ZuzuUsageRole
  slot: string
  pinnedVersion: string
}

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
  const roleFilter = ref('')
  const repoCollectionFilter = ref('')
  const repoItems = ref<ZuzuRepoMedia[]>([])
  const repoTotal = ref(0)
  const repoIndexed = ref(0)
  const repoCounts = ref<Record<ZuzuRepoFileStatus, number>>({
    present: 0,
    missing: 0,
    unverified: 0,
  })
  const repoCollections = ref<ZuzuRepoMediaPage['collections']>([])
  const repoFocusKey = ref<string | null>(null)
  const selectedIds = ref<number[]>([])
  const focusId = ref<number | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const requesting = ref(false)
  const resourceAudit = ref<ZuzuResourceAuditReport | null>(null)
  const auditingResources = ref(false)
  const resourceAuditError = ref('')
  const error = ref('')
  const notice = ref('')
  let requestSerial = 0
  let searchTimer: ReturnType<typeof setTimeout> | null = null

  const focused = computed(
    () => items.value.find((item) => item.id === focusId.value) ?? null,
  )
  const selectedItems = computed(() =>
    items.value.filter((item) => selectedIds.value.includes(item.id)),
  )
  const isRepositoryView = computed(() => kindFilter.value === 'repository')
  const focusedRepo = computed(
    () =>
      repoItems.value.find((item) => item.key === repoFocusKey.value) ?? null,
  )
  const pageCount = computed(() =>
    isRepositoryView.value
      ? Math.max(1, Math.ceil(repoTotal.value / ZUZU_REPO_PAGE_SIZE))
      : Math.max(1, Math.ceil(total.value / ZUZU_ASSET_PAGE_SIZE)),
  )

  async function loadRepoMedia(serial: number): Promise<void> {
    const params = new URLSearchParams({
      page: String(page.value),
      q: search.value,
      project: projectFilter.value,
      collection: repoCollectionFilter.value,
    })
    try {
      const result = await performFetch<ZuzuRepoMediaPage>(
        `/api/worlds/zuzu/repo-media?${params.toString()}`,
      )
      if (serial !== requestSerial) return
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Unable to index repository media.')
      }
      repoItems.value = result.data.items
      repoTotal.value = result.data.total
      repoIndexed.value = result.data.indexed
      repoCounts.value = result.data.counts
      repoCollections.value = result.data.collections
      if (!repoItems.value.some((item) => item.key === repoFocusKey.value)) {
        repoFocusKey.value = repoItems.value[0]?.key ?? null
      }
    } catch (cause) {
      if (serial !== requestSerial) return
      error.value =
        cause instanceof Error
          ? cause.message
          : 'Unable to index repository media.'
      repoItems.value = []
      repoTotal.value = 0
    } finally {
      if (serial === requestSerial) loading.value = false
    }
  }

  async function load(): Promise<void> {
    const serial = ++requestSerial
    loading.value = true
    error.value = ''
    if (isRepositoryView.value) return loadRepoMedia(serial)
    const params = new URLSearchParams({
      page: String(page.value),
      q: search.value,
      project: projectFilter.value,
      kind: kindFilter.value,
      role: roleFilter.value,
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
      error.value =
        cause instanceof Error
          ? cause.message
          : 'Unable to load the world library.'
      items.value = []
      total.value = 0
    } finally {
      if (serial === requestSerial) loading.value = false
    }
  }

  async function loadResourceAudit(): Promise<void> {
    if (auditingResources.value) return
    auditingResources.value = true
    resourceAuditError.value = ''
    try {
      const result = await performFetch<ZuzuResourceAuditReport>(
        '/api/worlds/zuzu/resource-audit',
      )
      if (!result.success || !result.data) {
        throw new Error(
          result.message || 'Unable to audit Zuzu resource identities.',
        )
      }
      resourceAudit.value = result.data
    } catch (cause) {
      resourceAudit.value = null
      resourceAuditError.value =
        cause instanceof Error
          ? cause.message
          : 'Unable to load resource audit.'
    } finally {
      auditingResources.value = false
    }
  }

  function setFilter(
    key: 'project' | 'kind' | 'role' | 'collection',
    value: string,
  ): void {
    if (key === 'project') projectFilter.value = value
    else if (key === 'role') roleFilter.value = value
    else if (key === 'collection') repoCollectionFilter.value = value
    else {
      kindFilter.value = value
      selectedIds.value = []
    }
    page.value = 1
    void load()
  }

  function focusRepo(key: string): void {
    repoFocusKey.value = key
  }

  function openRepoMedia(query: string, key: string | null = null): void {
    kindFilter.value = 'repository'
    repoCollectionFilter.value = ''
    projectFilter.value = ''
    search.value = query
    repoFocusKey.value = key
    selectedIds.value = []
    page.value = 1
    void load()
  }

  function openArtImage(id: number): void {
    kindFilter.value = 'all'
    roleFilter.value = ''
    projectFilter.value = ''
    search.value = String(id)
    focusId.value = id
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

  async function assign(
    projectIds: number[],
    action: 'link' | 'unlink',
    usage?: ZuzuUsageDraft,
    artImageIds?: number[],
  ): Promise<boolean> {
    const ids = artImageIds?.length
      ? artImageIds
      : selectedIds.value.length
        ? selectedIds.value
        : focused.value
          ? [focused.value.id]
          : []
    if (!ids.length || !projectIds.length) {
      error.value = 'Select artwork and at least one project.'
      return false
    }
    saving.value = true
    error.value = ''
    notice.value = ''
    try {
      const result = await performFetch<{
        changed: number
        references: number
      }>('/api/worlds/zuzu/assign', {
        method: 'POST',
        body: JSON.stringify({
          artImageIds: ids,
          projectIds,
          action,
          ...(action === 'link' && usage
            ? {
                usage: {
                  role: usage.role,
                  slot: usage.slot.trim() || null,
                  pinnedVersion: usage.pinnedVersion.trim() || null,
                },
              }
            : {}),
        }),
      })
      if (!result.success)
        throw new Error(result.message || 'Could not save links.')
      notice.value = result.message || 'Project references saved.'
      await load()
      return true
    } catch (cause) {
      error.value =
        cause instanceof Error ? cause.message : 'Could not update projects.'
      return false
    } finally {
      saving.value = false
    }
  }

  function unlinkUsage(
    artImageId: number,
    projectId: number,
  ): Promise<boolean> {
    return assign([projectId], 'unlink', undefined, [artImageId])
  }

  async function requestArtChange(
    projectSlug: string,
    direction: string,
  ): Promise<boolean> {
    const art = focused.value
    if (!art || !direction.trim()) {
      error.value = 'Choose an asset and describe the requested change.'
      return false
    }
    requesting.value = true
    error.value = ''
    notice.value = ''
    try {
      const result = await performFetch<{ id: number }>(
        '/api/worlds/zuzu/request',
        {
          method: 'POST',
          body: JSON.stringify({
            artImageId: art.id,
            projectSlug: projectSlug || art.sourceProject,
            direction: direction.trim(),
          }),
        },
      )
      if (!result.success)
        throw new Error(result.message || 'Could not save request.')
      notice.value = result.message || 'Private request saved for agent review.'
      return true
    } catch (cause) {
      error.value =
        cause instanceof Error
          ? cause.message
          : 'Unable to send the Conductor request.'
      return false
    } finally {
      requesting.value = false
    }
  }

  return {
    items,
    projects,
    total,
    recordedCount,
    ledgerCount,
    page,
    pageCount,
    search,
    projectFilter,
    kindFilter,
    roleFilter,
    repoCollectionFilter,
    repoItems,
    repoTotal,
    repoIndexed,
    repoCounts,
    repoCollections,
    repoFocusKey,
    focusedRepo,
    isRepositoryView,
    selectedIds,
    selectedItems,
    focusId,
    focused,
    loading,
    saving,
    requesting,
    error,
    notice,
    resourceAudit,
    resourceAuditError,
    auditingResources,
    loadResourceAudit,
    load,
    setFilter,
    setSearch,
    goToPage,
    focus,
    focusRepo,
    openRepoMedia,
    openArtImage,
    toggle,
    clearSelection,
    assign,
    unlinkUsage,
    requestArtChange,
  }
})
