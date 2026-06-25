// /stores/pageStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ContentCollectionItem } from '@nuxt/content'
import type { BuilderCard } from '@/stores/helpers/builderCards'
import { useNavStore } from '@/stores/navStore'
import { useSheetStore } from '@/stores/sheetStore'

export type PageLayoutKey = 'default' | 'minimal' | 'vertical-scroll' | false
export type WorkspaceCardsInput = string | BuilderCard[]
export type PageNarratorKind = 'bot' | 'character'
export type PageNarratorRef =
  | string
  | {
      type?: PageNarratorKind
      slug: string
    }

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
    narrator: getNarratorRef(currentPage.value?.narrator),
    artPrompt: getString(currentPage.value?.artPrompt),
    sort: currentPage.value?.sort ?? '',
    dashboardKey: getString(currentPage.value?.dashboardKey),
    dashboardTab: getString(currentPage.value?.dashboardTab),
    loadingMessage: getString(currentPage.value?.loadingMessage),
    refreshLabel: getString(currentPage.value?.refreshLabel),
  }))

  function syncDashboardShellFromPage(): void {
    const navStore = useNavStore()

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
  }

  function initialize(): void {
    if (initialized.value) return

    initialized.value = true
    ready.value = true
  }

  function setLoading(value: boolean): void {
    isLoading.value = value
  }

  function setPage(newPage: ContentCollectionItem): void {
    page.value = newPage
    workspaceCardKey.value = ''
    ready.value = true
    isLoading.value = false
    lastResolvedPath.value = (newPage as WorkspacePage).path ?? ''

    useSheetStore().clearSheet()

    syncDashboardShellFromPage()
  }

  function clearPage(): void {
    const navStore = useNavStore()

    page.value = null
    workspaceCardKey.value = ''
    ready.value = true
    isLoading.value = false

    useSheetStore().clearSheet()
    navStore.clearDashboardShell()
  }

  function resetPage(): void {
    const navStore = useNavStore()

    page.value = null
    workspaceCardKey.value = ''
    ready.value = false
    isLoading.value = false
    lastResolvedPath.value = ''

    navStore.clearDashboardShell()
  }

  function setWorkspaceCardKey(cardKey: string): void {
    workspaceCardKey.value = cardKey
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

    setPage,
    clearPage,
    resetPage,
    setLoading,
    initialize,
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
    narrator: computed(() => meta.value.narrator),
    artPrompt: computed(() => meta.value.artPrompt),
    sort: computed(() => meta.value.sort),
    dashboardKey: computed(() => meta.value.dashboardKey),
    dashboardTab: computed(() => meta.value.dashboardTab),
    loadingMessage: computed(() => meta.value.loadingMessage),
    refreshLabel: computed(() => meta.value.refreshLabel),
  }
})