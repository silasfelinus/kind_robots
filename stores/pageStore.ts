// /stores/pageStore.ts
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { ContentCollectionItem } from '@nuxt/content'
import type { BuilderCard } from '@/stores/helpers/builderCards'
import type { NavigationCard } from '@/stores/helpers/channelContent'
import {
  channelTabsToCards,
  navigationCardsToBuilderCards,
} from '@/stores/helpers/channelCards'
import { useChannelContentStore } from '@/stores/channelContentStore'
import { useNavStore } from '@/stores/navStore'
import { useSheetStore } from '@/stores/sheetStore'

export type PageLayoutKey = 'default' | 'minimal' | 'vertical-scroll' | false
export type WorkspaceCardsInput =
  | string
  | BuilderCard[]
  | NavigationCard[]
export type PageNarratorKind = 'bot' | 'character'
export type PageNarratorRef =
  | string
  | {
      type?: PageNarratorKind
      slug: string
    }

export type WorkspacePage = ContentCollectionItem & {
  cards?: WorkspaceCardsInput
  contentType?: 'page' | 'channel' | 'tab'
  channelKey?: string
  tabKey?: string
  dashboardKey?: string
  dashboardTab?: string
  loadingMessage?: string
  refreshLabel?: string
  room?: string
  subtitle?: string
  tooltip?: string
  dottiTip?: string
  amiTip?: string
  dottitip?: string
  amitip?: string
  narrator?: PageNarratorRef
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
        'label' in entry &&
        'title' in entry &&
        'icon' in entry &&
        'tagline' in entry &&
        'narrative' in entry &&
        'restoresFields' in entry &&
        'steps' in entry,
    )
  )
}

function isNavigationCardArray(value: unknown): value is NavigationCard[] {
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

function getNarratorRef(value: unknown): PageNarratorRef | null {
  if (typeof value === 'string') {
    const slug = value.trim()
    return slug ? slug : null
  }

  if (!value || typeof value !== 'object') return null

  const record = value as {
    type?: unknown
    slug?: unknown
  }

  const slug = getString(record.slug)
  if (!slug) return null

  return {
    type: record.type === 'character' ? 'character' : 'bot',
    slug,
  }
}

export const usePageStore = defineStore('pageStore', () => {
  const page = ref<ContentCollectionItem | null>(null)
  const ready = ref(false)
  const initialized = ref(false)
  const isLoading = ref(false)
  const workspaceCardKey = ref('')
  const lastResolvedPath = ref('')
  const overrideCards = ref<BuilderCard[] | null>(null)
  const initializePromise = ref<Promise<void> | null>(null)

  const channelContentStore = useChannelContentStore()

  const currentPage = computed(() => page.value as WorkspacePage | null)

  const layout = computed<PageLayoutKey>(() => 'default')

  const cardsKey = computed(() => {
    const value = currentPage.value?.cards
    return getCardsKey(value)
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
    dottiTip:
      getString(currentPage.value?.dottiTip) ||
      getString(currentPage.value?.dottitip),
    amiTip:
      getString(currentPage.value?.amiTip) ||
      getString(currentPage.value?.amitip),
    narrator: getNarratorRef(currentPage.value?.narrator),
    artPrompt: getString(currentPage.value?.artPrompt),
    sort: currentPage.value?.sort ?? '',
    contentType: getString(currentPage.value?.contentType),
    channelKey:
      getString(currentPage.value?.channelKey) ||
      getString(currentPage.value?.dashboardKey),
    tabKey:
      getString(currentPage.value?.tabKey) ||
      getString(currentPage.value?.dashboardTab),
    dashboardKey:
      getString(currentPage.value?.dashboardKey) ||
      getString(currentPage.value?.channelKey),
    dashboardTab:
      getString(currentPage.value?.dashboardTab) ||
      getString(currentPage.value?.tabKey),
    loadingMessage: getString(currentPage.value?.loadingMessage),
    refreshLabel: getString(currentPage.value?.refreshLabel),
  }))

  const resolvedLocation = computed(() =>
    channelContentStore.resolveActiveLocation({
      channelKey: meta.value.channelKey,
      tabKey: meta.value.tabKey,
      dashboardKey: meta.value.dashboardKey,
      dashboardTab: meta.value.dashboardTab,
      path: currentPage.value?.path || lastResolvedPath.value,
    }),
  )

  const resolvedChannel = computed(
    () => resolvedLocation.value?.channel ?? null,
  )
  const resolvedTab = computed(() => resolvedLocation.value?.tab ?? null)

  const activeChannelKey = computed(
    () => resolvedChannel.value?.channelKey || meta.value.channelKey,
  )
  const activeTabKey = computed(
    () => resolvedTab.value?.tabKey || meta.value.tabKey,
  )

  const cards = computed<BuilderCard[]>(() => {
    if (overrideCards.value !== null) return overrideCards.value

    const value = currentPage.value?.cards
    if (isBuilderCardArray(value)) return value
    if (isNavigationCardArray(value)) {
      return navigationCardsToBuilderCards(value)
    }

    return resolvedChannel.value
      ? channelTabsToCards(resolvedChannel.value)
      : []
  })

  function setSheetFromResolvedTab(): void {
    const tab = resolvedTab.value
    if (!tab) return

    useSheetStore().setSheetFromTab({
      key: tab.tabKey,
      label: tab.label,
      title: tab.title,
      summary: tab.summary,
      description: tab.description,
      narrative: tab.narrative,
      icon: tab.icon,
      image: tab.image,
    })
  }

  function syncDashboardShellFromPage(): void {
    const navStore = useNavStore()
    const channel = resolvedChannel.value
    const tab = resolvedTab.value

    if (channel && tab) {
      channelContentStore.setActiveTab(channel.channelKey, tab.tabKey)
    }

    const tabCards = typeof tab?.cards === 'string' ? tab.cards.trim() : ''

    navStore.setDashboardShellFromContent({
      title: tab?.title || channel?.title || meta.value.title,
      subtitle: tab?.subtitle || channel?.subtitle || meta.value.subtitle,
      description:
        tab?.description || channel?.description || meta.value.description,
      summary: tab?.summary || channel?.summary || meta.value.summary,
      dashboardKey:
        tab?.dashboardKey || channel?.dashboardKey || meta.value.dashboardKey,
      dashboardTab:
        tab?.dashboardTab || tab?.tabKey || meta.value.dashboardTab,
      cards: tabCards || cardsKey.value,
      loadingMessage:
        tab?.loadingMessage ||
        channel?.loadingMessage ||
        meta.value.loadingMessage,
      refreshLabel:
        tab?.refreshLabel || channel?.refreshLabel || meta.value.refreshLabel,
    })

    setSheetFromResolvedTab()
  }

  async function initialize(force = false): Promise<void> {
    if (initializePromise.value && !force) return initializePromise.value
    if (initialized.value && !force) return

    initializePromise.value = (async () => {
      const navStore = useNavStore()

      await navStore.initialize(force)
      await channelContentStore.initialize(force)

      initialized.value = true
      ready.value = true

      if (page.value) syncDashboardShellFromPage()
    })()

    try {
      await initializePromise.value
    } finally {
      initializePromise.value = null
    }
  }

  function setLoading(value: boolean): void {
    isLoading.value = value
  }

  function setPage(newPage: ContentCollectionItem): void {
    page.value = newPage
    workspaceCardKey.value = ''
    overrideCards.value = null
    ready.value = true
    isLoading.value = false
    lastResolvedPath.value = (newPage as WorkspacePage).path ?? ''

    useSheetStore().clearSheet()

    syncDashboardShellFromPage()

    if (!initialized.value || !channelContentStore.initialized) {
      void initialize().then(() => {
        if (page.value === newPage) syncDashboardShellFromPage()
      })
    }
  }

  function clearPage(): void {
    const navStore = useNavStore()

    page.value = null
    workspaceCardKey.value = ''
    overrideCards.value = null
    ready.value = true
    isLoading.value = false

    useSheetStore().clearSheet()
    navStore.clearDashboardShell()
  }

  function resetPage(): void {
    const navStore = useNavStore()

    page.value = null
    workspaceCardKey.value = ''
    overrideCards.value = null
    ready.value = false
    isLoading.value = false
    lastResolvedPath.value = ''

    navStore.clearDashboardShell()
  }

  function setWorkspaceCardKey(cardKey: string): void {
    workspaceCardKey.value = cardKey
  }

  function setCards(newCards: BuilderCard[]): void {
    overrideCards.value = newCards
  }

  function clearCards(): void {
    overrideCards.value = null
  }

  watch(
    () => ({
      channelKey: activeChannelKey.value,
      tabKey: activeTabKey.value,
    }),
    (next, previous) => {
      if (!page.value) return
      if (
        next.channelKey === previous.channelKey &&
        next.tabKey === previous.tabKey
      ) {
        return
      }

      syncDashboardShellFromPage()
    },
  )

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
    initializePromise,
    resolvedLocation,
    resolvedChannel,
    resolvedTab,
    activeChannelKey,
    activeTabKey,

    setPage,
    clearPage,
    resetPage,
    setLoading,
    initialize,
    setWorkspaceCardKey,
    setCards,
    clearCards,

    title: computed(() => meta.value.title),
    room: computed(() => meta.value.room),
    subtitle: computed(() => meta.value.subtitle),
    description: computed(() => meta.value.description),
    summary: computed(() => meta.value.summary),
    icon: computed(() => meta.value.icon),
    image: computed(() => meta.value.image),
    tooltip: computed(() => meta.value.tooltip),
    dottiTip: computed(() => meta.value.dottiTip),
    amiTip: computed(() => meta.value.amiTip),
    dottitip: computed(() => meta.value.dottiTip),
    amitip: computed(() => meta.value.amiTip),
    narrator: computed(() => meta.value.narrator),
    artPrompt: computed(() => meta.value.artPrompt),
    sort: computed(() => meta.value.sort),
    contentType: computed(() => meta.value.contentType),
    channelKey: computed(() => meta.value.channelKey),
    tabKey: computed(() => meta.value.tabKey),
    dashboardKey: computed(() => meta.value.dashboardKey),
    dashboardTab: computed(() => meta.value.dashboardTab),
    loadingMessage: computed(() => meta.value.loadingMessage),
    refreshLabel: computed(() => meta.value.refreshLabel),
  }
})