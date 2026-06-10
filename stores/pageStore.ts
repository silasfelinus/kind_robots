// /stores/pageStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ContentCollectionItem } from '@nuxt/content'
import type { BuilderCard } from '@/stores/helpers/builderCards'
import { useNavStore } from '@/stores/navStore'
import { useSheetStore } from '@/stores/sheetStore'

export type PageLayoutKey = 'default' | 'minimal' | 'vertical-scroll' | false
export type WorkspaceCardsInput = string | BuilderCard[]

export type WorkspacePage = ContentCollectionItem & {
  cards?: WorkspaceCardsInput
  dashboardKey?: string
  dashboardTab?: string
  loadingMessage?: string
  refreshLabel?: string
  room?: string
  subtitle?: string
  tooltip?: string
  dottitip?: string
  amitip?: string
  artPrompt?: string
  sort?: string | number
  icon?: string
  image?: string
  description?: string
  summary?: string
}

function normalizeImagePath(path: string): string {
  if (!path) return ''
  if (path.startsWith('/') || path.startsWith('http')) return path
  return `/images/${path}`
}

function isBuilderCardArray(value: unknown): value is BuilderCard[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        entry &&
        typeof entry === 'object' &&
        'key' in entry &&
        'label' in entry,
    )
  )
}

function getString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function getCardsKey(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export const usePageStore = defineStore('pageStore', () => {
  const page = ref<ContentCollectionItem | null>(null)
  const ready = ref(false)
  const initialized = ref(false)
  const isLoading = ref(false)
  const workspaceCardKey = ref('')
  const lastResolvedPath = ref('')
  const lastPageAction = ref('created')
  const loadAttempt = ref(0)

  const currentPage = computed(() => page.value as WorkspacePage | null)

  const layout = computed<PageLayoutKey>(() => 'default')

  const cardsKey = computed(() => {
    const value = currentPage.value?.cards
    return getCardsKey(value)
  })

  const cards = computed<BuilderCard[]>(() => {
    const value = currentPage.value?.cards
    return isBuilderCardArray(value) ? value : []
  })

  const meta = computed(() => ({
    title: getString(currentPage.value?.title) || 'Robots',
    room: getString(currentPage.value?.room) || 'Kind Robots',
    subtitle:
      getString(currentPage.value?.subtitle) || 'Welcome to Kind Robots',
    description: getString(currentPage.value?.description),
    summary: getString(currentPage.value?.summary),
    icon: getString(currentPage.value?.icon) || 'mdi:robot-happy',
    image: normalizeImagePath(
      getString(currentPage.value?.image) || '/images/botcafe.webp',
    ),
    tooltip: getString(currentPage.value?.tooltip),
    dottitip: getString(currentPage.value?.dottitip),
    amitip: getString(currentPage.value?.amitip),
    artPrompt: getString(currentPage.value?.artPrompt),
    sort: currentPage.value?.sort ?? '',
    dashboardKey: getString(currentPage.value?.dashboardKey),
    dashboardTab: getString(currentPage.value?.dashboardTab),
    loadingMessage: getString(currentPage.value?.loadingMessage),
    refreshLabel: getString(currentPage.value?.refreshLabel),
  }))

  const debugState = computed(() => ({
    initialized: initialized.value,
    ready: ready.value,
    isLoading: isLoading.value,
    hasPage: Boolean(page.value),
    pagePath: currentPage.value?.path ?? null,
    title: meta.value.title,
    dashboardKey: meta.value.dashboardKey,
    dashboardTab: meta.value.dashboardTab,
    cardsKey: cardsKey.value,
    lastResolvedPath: lastResolvedPath.value,
    lastPageAction: lastPageAction.value,
    loadAttempt: loadAttempt.value,
  }))

  function logPageStore(action: string, payload: Record<string, unknown> = {}) {
    if (!import.meta.client) return

    console.groupCollapsed(`[pageStore] ${action}`)
    console.log('payload:', payload)
    console.log('state:', debugState.value)
    console.groupEnd()
  }

  function syncDashboardShellFromPage(): void {
    const navStore = useNavStore()

    logPageStore('syncDashboardShellFromPage:start', {
      title: meta.value.title,
      dashboardKey: meta.value.dashboardKey,
      dashboardTab: meta.value.dashboardTab,
      cardsKey: cardsKey.value,
    })

    navStore.setDashboardShellFromContent({
      title: meta.value.title,
      subtitle: meta.value.subtitle,
      description: meta.value.description,
      summary: meta.value.summary,
      dashboardKey: meta.value.dashboardKey,
      dashboardTab: meta.value.dashboardTab,
      cards: cardsKey.value,
      loadingMessage: meta.value.loadingMessage,
      refreshLabel: meta.value.refreshLabel,
    })

    logPageStore('syncDashboardShellFromPage:done')
  }

  function initialize(): void {
    if (initialized.value) {
      logPageStore('initialize:skipped')
      return
    }

    initialized.value = true
    ready.value = true
    lastPageAction.value = 'initialize'

    logPageStore('initialize:done')
  }

  function setLoading(value: boolean, reason = 'unknown'): void {
    isLoading.value = value
    lastPageAction.value = `setLoading:${value}`

    logPageStore('setLoading', {
      value,
      reason,
    })
  }

  function setPage(newPage: ContentCollectionItem, reason = 'unknown'): void {
    page.value = newPage
    workspaceCardKey.value = ''
    ready.value = true
    isLoading.value = false
    lastResolvedPath.value = (newPage as WorkspacePage).path ?? ''
    lastPageAction.value = 'setPage'
    loadAttempt.value = 0

    useSheetStore().clearSheet()

    syncDashboardShellFromPage()

    logPageStore('setPage', {
      reason,
      path: currentPage.value?.path,
      title: meta.value.title,
      room: meta.value.room,
      dashboardKey: meta.value.dashboardKey,
      dashboardTab: meta.value.dashboardTab,
      cardsKey: cardsKey.value,
      page: newPage,
    })
  }

  function clearPage(reason = 'unknown'): void {
    const navStore = useNavStore()

    page.value = null
    workspaceCardKey.value = ''
    ready.value = true
    isLoading.value = false
    lastPageAction.value = 'clearPage'

    useSheetStore().clearSheet()
    navStore.clearDashboardShell()

    logPageStore('clearPage', {
      reason,
    })
  }

  function resetPage(reason = 'unknown'): void {
    const navStore = useNavStore()

    page.value = null
    workspaceCardKey.value = ''
    ready.value = false
    isLoading.value = false
    lastResolvedPath.value = ''
    lastPageAction.value = 'resetPage'
    loadAttempt.value = 0

    navStore.clearDashboardShell()

    logPageStore('resetPage', {
      reason,
    })
  }

  function registerLoadAttempt(path: string, reason = 'unknown'): number {
    loadAttempt.value += 1
    lastResolvedPath.value = path
    lastPageAction.value = 'registerLoadAttempt'

    logPageStore('registerLoadAttempt', {
      path,
      reason,
      attempt: loadAttempt.value,
    })

    return loadAttempt.value
  }

  function setWorkspaceCardKey(cardKey: string): void {
    workspaceCardKey.value = cardKey
    lastPageAction.value = 'setWorkspaceCardKey'

    logPageStore('setWorkspaceCardKey', {
      cardKey,
    })
  }

  return {
    page,
    currentPage,
    layout,
    meta,
    ready,
    initialized,
    isLoading,
    cards,
    cardsKey,
    workspaceCardKey,
    lastResolvedPath,
    lastPageAction,
    loadAttempt,
    debugState,

    setPage,
    clearPage,
    resetPage,
    setLoading,
    initialize,
    registerLoadAttempt,
    setWorkspaceCardKey,

    title: computed(() => meta.value.title),
    room: computed(() => meta.value.room),
    subtitle: computed(() => meta.value.subtitle),
    description: computed(() => meta.value.description),
    summary: computed(() => meta.value.summary),
    icon: computed(() => meta.value.icon),
    image: computed(() => meta.value.image),
    tooltip: computed(() => meta.value.tooltip),
    dottitip: computed(() => meta.value.dottitip),
    amitip: computed(() => meta.value.amitip),
    artPrompt: computed(() => meta.value.artPrompt),
    sort: computed(() => meta.value.sort),
    dashboardKey: computed(() => meta.value.dashboardKey),
    dashboardTab: computed(() => meta.value.dashboardTab),
    loadingMessage: computed(() => meta.value.loadingMessage),
    refreshLabel: computed(() => meta.value.refreshLabel),
  }
})
