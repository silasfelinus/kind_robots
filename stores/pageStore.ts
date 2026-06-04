// /stores/pageStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ContentCollectionItem } from '@nuxt/content'
import type { BuilderCard } from '@/stores/helpers/builderCards'

export type PageLayoutKey = 'default' | 'minimal' | 'vertical-scroll' | false
export type WorkspaceCardsInput = string | BuilderCard[]

export type WorkspacePage = ContentCollectionItem & {
  cards?: WorkspaceCardsInput
  dashboardKey?: string
  dashboardTab?: string
  loadingMessage?: string
  refreshLabel?: string
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

export const usePageStore = defineStore('pageStore', () => {
  const page = ref<ContentCollectionItem | null>(null)
  const ready = ref(false)
  const initialized = ref(false)
  const workspaceCardKey = ref('')

  const currentPage = computed(() => page.value as WorkspacePage | null)

  const layout = computed<PageLayoutKey>(() => 'default')

  const cardsKey = computed(() => {
    const value = currentPage.value?.cards
    return typeof value === 'string' ? value : ''
  })

  const cards = computed<BuilderCard[]>(() => {
    const value = currentPage.value?.cards
    return isBuilderCardArray(value) ? value : []
  })

  const meta = computed(() => ({
    title: currentPage.value?.title ?? 'Robots',
    room: currentPage.value?.room ?? 'Kind Robots',
    subtitle: currentPage.value?.subtitle ?? 'Welcome to Kind Robots',
    description: currentPage.value?.description ?? '',
    icon: currentPage.value?.icon ?? 'mdi:robot-happy',
    image: normalizeImagePath(
      currentPage.value?.image ?? '/images/botcafe.webp',
    ),
    tooltip: currentPage.value?.tooltip ?? '',
    dottitip: currentPage.value?.dottitip ?? '',
    amitip: currentPage.value?.amitip ?? '',
    artPrompt: currentPage.value?.artPrompt ?? '',
    sort: currentPage.value?.sort ?? '',
    dashboardKey: currentPage.value?.dashboardKey ?? '',
    dashboardTab: currentPage.value?.dashboardTab ?? '',
    loadingMessage: currentPage.value?.loadingMessage ?? '',
    refreshLabel: currentPage.value?.refreshLabel ?? '',
  }))

  function initialize(): void {
    if (initialized.value) return

    initialized.value = true
    ready.value = true

    if (import.meta.client) {
      console.log('[pageStore] initialized')
    }
  }

  function setPage(newPage: ContentCollectionItem): void {
    page.value = newPage
    workspaceCardKey.value = ''
    ready.value = true

    if (import.meta.client) {
      console.groupCollapsed('[pageStore] setPage')
      console.log('title:', meta.value.title)
      console.log('room:', meta.value.room)
      console.log('dashboardKey:', meta.value.dashboardKey)
      console.log('dashboardTab:', meta.value.dashboardTab)
      console.log('path:', currentPage.value?.path)
      console.log('page:', newPage)
      console.groupEnd()
    }
  }

  function clearPage(): void {
    page.value = null
    workspaceCardKey.value = ''
    ready.value = true

    if (import.meta.client) {
      console.groupCollapsed('[pageStore] clearPage')
      console.log('Page cleared because Nuxt Content returned no match.')
      console.groupEnd()
    }
  }

  function setWorkspaceCardKey(cardKey: string): void {
    workspaceCardKey.value = cardKey

    if (import.meta.client) {
      console.log('[pageStore] setWorkspaceCardKey', {
        cardKey,
      })
    }
  }

  return {
    page,
    layout,
    meta,
    ready,
    initialized,
    cards,
    cardsKey,
    workspaceCardKey,
    setPage,
    clearPage,
    initialize,
    setWorkspaceCardKey,

    title: computed(() => meta.value.title),
    room: computed(() => meta.value.room),
    subtitle: computed(() => meta.value.subtitle),
    description: computed(() => meta.value.description),
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
