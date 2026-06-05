// /stores/navStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { SmartIcon } from '~/prisma/generated/prisma/client'
import smartIconSeeds from '@/stores/seeds/smartIcons.json'
import {
  dashboardConfigs,
  getDashboardDefaultTabs,
  isDashboardTabKey,
  normalizeDashboardTabs,
  type DashboardConfig,
  type DashboardKey,
  type DashboardTabConfig,
} from '@/stores/helpers/dashboardHelper'
import { useSmartbarStore } from '@/stores/smartbarStore'
import { handleError } from '@/stores/utils'
import { getModelCards } from '@/stores/helpers/modelCards'

export type NavTab = 'favorites' | 'navigation' | 'all'

export interface ContentDashboardInput {
  title?: string | null
  subtitle?: string | null
  description?: string | null
  summary?: string | null
  dashboardKey?: string | null
  dashboardTab?: string | null
  cards?: string | null
  loadingMessage?: string | null
  refreshLabel?: string | null
}

export interface DashboardShellState {
  enabled: boolean
  dashboardKey: DashboardKey
  activeTabHint: string
  cards: string | null
  title: string
  summary: string
  loadingMessage: string
  refreshLabel: string
}

const fallbackDashboardKey = 'user'
const fallbackDashboardTab = 'dashboard'

function getFallbackDashboardKey(): DashboardKey {
  if (fallbackDashboardKey in dashboardConfigs) {
    return fallbackDashboardKey as DashboardKey
  }

  const firstKey = Object.keys(dashboardConfigs)[0]

  return firstKey as DashboardKey
}

function getFallbackDashboardTab(dashboardKey: DashboardKey): string {
  if (isDashboardTabKey(dashboardKey, fallbackDashboardTab)) {
    return fallbackDashboardTab
  }

  return dashboardConfigs[dashboardKey].defaultTab
}

function resolveDashboardKey(value?: string | null): DashboardKey {
  const normalized = (value ?? '').trim()

  if (normalized && normalized in dashboardConfigs) {
    return normalized as DashboardKey
  }

  return getFallbackDashboardKey()
}

function resolveDashboardTab(
  dashboardKey: DashboardKey,
  value?: string | null,
): string {
  const normalized = (value ?? '').trim()

  if (normalized && isDashboardTabKey(dashboardKey, normalized)) {
    return normalized
  }

  return getFallbackDashboardTab(dashboardKey)
}

function defaultDashboardShellState(): DashboardShellState {
  const dashboardKey = getFallbackDashboardKey()
  const activeTabHint = getFallbackDashboardTab(dashboardKey)

  return {
    enabled: true,
    dashboardKey,
    activeTabHint,
    cards: null,
    title: 'Dashboard',
    summary: '',
    loadingMessage: 'Loading…',
    refreshLabel: 'Refresh',
  }
}

const navIconsStorageKey = 'navIcons'
const navFavoritesStorageKey = 'navFavorites'
const dashboardTabsStorageKey = 'dashboardTabs'
const wonderLabFolderStorageKey = 'wonderLabFolder'
const workspaceSheetOpenStorageKey = 'workspaceSheetOpen'

const isClient = typeof window !== 'undefined'

function safeGetLocalStorage(key: string): string | null {
  if (!isClient) return null

  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLocalStorage(key: string, value: string): void {
  if (!isClient) return

  try {
    localStorage.setItem(key, value)
  } catch {}
}

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function safeParseRecord(raw: string | null): Record<string, string> {
  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw)

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => typeof value === 'string'),
    ) as Record<string, string>
  } catch {
    return {}
  }
}

function safeParseBoolean(raw: string | null, fallback = false): boolean {
  if (raw === 'true') return true
  if (raw === 'false') return false

  return fallback
}

function normalizeIcon(icon: SmartIcon): SmartIcon {
  return {
    ...icon,
    type: icon.type || 'directory',
  }
}

function normalizeIcons(icons: SmartIcon[]): SmartIcon[] {
  return icons.map(normalizeIcon)
}

function seededIcons(): SmartIcon[] {
  return normalizeIcons(smartIconSeeds as SmartIcon[])
}

export const useNavStore = defineStore('navStore', () => {
  const items = ref<SmartIcon[]>([])
  const favorites = ref<string[]>([])
  const activeTab = ref<NavTab>('navigation')
  const activeModelType = ref<string | null>(null)

  const isInitialized = ref(false)
  const isInitializing = ref(false)
  const loading = ref(false)
  const lastError = ref<string | null>(null)
  const initializePromise = ref<Promise<void> | null>(null)

  const dashboardShell = ref<DashboardShellState>(defaultDashboardShellState())
  const workspaceSheetOpen = ref(false)

  const routeHistory = ref<string[]>([])
  const currentIndex = ref(-1)

  const dashboardTabs = ref<Record<DashboardKey, string>>({
    ...getDashboardDefaultTabs(),
    [getFallbackDashboardKey()]: getFallbackDashboardTab(
      getFallbackDashboardKey(),
    ),
  })

  const dashboardTabsHydrated = ref(false)

  const wonderLabFolder = ref<string | null>(null)

  const smartbarStore = useSmartbarStore()

  const directoryIcons = computed(() =>
    items.value.filter((icon) => (icon.type ?? 'directory') === 'directory'),
  )

  const modelTypes = computed(() => {
    const set = new Set<string>()

    for (const icon of directoryIcons.value) {
      const modelType = (icon.modelType ?? '').trim()
      const category = (icon.category ?? '').trim()

      if (modelType && category === 'model') {
        set.add(modelType)
      }
    }

    return Array.from(set).sort()
  })

  const favoritesIcons = computed(() => {
    const favoriteSet = new Set(favorites.value)

    return directoryIcons.value.filter((icon) => {
      const link = (icon.link ?? '').trim()

      return link.length > 0 && favoriteSet.has(link)
    })
  })

  const canGoBack = computed(() => currentIndex.value > 0)

  const canGoForward = computed(
    () =>
      currentIndex.value >= 0 &&
      currentIndex.value < routeHistory.value.length - 1,
  )

  const backPath = computed(() =>
    canGoBack.value ? routeHistory.value[currentIndex.value - 1] : null,
  )

  const forwardPath = computed(() =>
    canGoForward.value ? routeHistory.value[currentIndex.value + 1] : null,
  )

  const dashboardKeys = computed(
    () => Object.keys(dashboardConfigs) as DashboardKey[],
  )

  const dashboardList = computed(() =>
    dashboardKeys.value.map((key) => dashboardConfigs[key]),
  )

  function setLastError(error: unknown, fallback: string): void {
    lastError.value = error instanceof Error ? error.message : fallback
  }

  function clearError(): void {
    lastError.value = null
  }

  function syncIconsToLocalStorage(): void {
    safeSetLocalStorage(navIconsStorageKey, JSON.stringify(items.value))
  }

  function syncFavoritesToLocalStorage(): void {
    safeSetLocalStorage(navFavoritesStorageKey, JSON.stringify(favorites.value))
  }

  function syncDashboardTabsToLocalStorage(reason = 'unknown'): void {
    const payload = JSON.stringify(dashboardTabs.value)

    safeSetLocalStorage(dashboardTabsStorageKey, payload)
  }

  function syncDashboardTabs(reason = 'manual syncDashboardTabs'): void {
    syncDashboardTabsToLocalStorage(reason)
  }

  function syncWorkspaceSheetOpenToLocalStorage(): void {
    safeSetLocalStorage(
      workspaceSheetOpenStorageKey,
      String(workspaceSheetOpen.value),
    )
  }

  function hydrateDashboardTabsFromLocalStorage(force = false): void {
    if (dashboardTabsHydrated.value && !force) return

    const raw = safeGetLocalStorage(dashboardTabsStorageKey)
    const parsed = safeParseRecord(raw)
    const normalized = normalizeDashboardTabs(parsed)
    const fallbackKey = getFallbackDashboardKey()
    const fallbackTab = resolveDashboardTab(
      fallbackKey,
      normalized[fallbackKey],
    )

    dashboardTabs.value = {
      ...getDashboardDefaultTabs(),
      ...normalized,
      [fallbackKey]: fallbackTab,
    }

    dashboardTabsHydrated.value = true
  }

  function hydrateWorkspaceSheetOpenFromLocalStorage(): void {
    workspaceSheetOpen.value = safeParseBoolean(
      safeGetLocalStorage(workspaceSheetOpenStorageKey),
      false,
    )
  }

  function getDashboardTab(dashboardKey: DashboardKey): string {
    const config = dashboardConfigs[dashboardKey]
    const current = dashboardTabs.value[dashboardKey]
    const resolved =
      current && isDashboardTabKey(dashboardKey, current)
        ? current
        : config.defaultTab

    return resolved
  }

  function setDashboardTab(
    dashboardKey: DashboardKey,
    tabKey: string,
    reason = 'unknown',
  ): string {
    const previous = dashboardTabs.value[dashboardKey]
    const nextTab = resolveDashboardTab(dashboardKey, tabKey)

    if (previous === nextTab) {
      return nextTab
    }

    dashboardTabs.value = {
      ...dashboardTabs.value,
      [dashboardKey]: nextTab,
    }

    syncDashboardTabsToLocalStorage(
      `setDashboardTab(${dashboardKey}, ${nextTab}) from ${reason}`,
    )

    return nextTab
  }

  function inferDashboardKeyFromContent(
    input: ContentDashboardInput,
  ): DashboardKey {
    return resolveDashboardKey(input.dashboardKey)
  }

  function setDashboardShellFromContent(input: ContentDashboardInput): void {
    const dashboardKey = inferDashboardKeyFromContent(input)
    const activeTabHint = resolveDashboardTab(dashboardKey, input.dashboardTab)
    const resolvedTab = setDashboardTab(
      dashboardKey,
      activeTabHint,
      'content frontmatter',
    )
    const cards = (input.cards ?? '').trim() || null

    dashboardShell.value = {
      enabled: true,
      dashboardKey,
      activeTabHint: resolvedTab,
      cards,
      title: input.title?.trim() || input.subtitle?.trim() || 'Dashboard',
      summary: input.summary?.trim() || input.description?.trim() || '',
      loadingMessage: input.loadingMessage?.trim() || 'Loading dashboard…',
      refreshLabel: input.refreshLabel?.trim() || 'Refresh',
    }
  }

  function clearDashboardShell(): void {
    dashboardShell.value = defaultDashboardShellState()

    const dashboardKey = dashboardShell.value.dashboardKey
    const activeTabHint = dashboardShell.value.activeTabHint

    setDashboardTab(dashboardKey, activeTabHint, 'clearDashboardShell fallback')
  }

  async function refreshDashboardShell(): Promise<void> {
    await initialize(true)
  }

  function syncWonderLabFolderToLocalStorage(): void {
    safeSetLocalStorage(wonderLabFolderStorageKey, wonderLabFolder.value ?? '')
  }

  function syncToLocalStorage(): void {
    syncIconsToLocalStorage()
    syncFavoritesToLocalStorage()
    syncWonderLabFolderToLocalStorage()
    syncWorkspaceSheetOpenToLocalStorage()
  }

  function hydrateIconsFromLocalStorage(): void {
    const storedIcons = safeParseArray<SmartIcon>(
      safeGetLocalStorage(navIconsStorageKey),
    )

    if (storedIcons.length) {
      items.value = normalizeIcons(storedIcons)
    }
  }

  function hydrateFavoritesFromLocalStorage(): void {
    favorites.value = safeParseArray<string>(
      safeGetLocalStorage(navFavoritesStorageKey),
    )
  }

  function hydrateWonderLabFolderFromLocalStorage(): void {
    wonderLabFolder.value =
      safeGetLocalStorage(wonderLabFolderStorageKey) || null
  }

  function hydrateFromLocalStorage(force = false): void {
    hydrateIconsFromLocalStorage()
    hydrateFavoritesFromLocalStorage()
    hydrateDashboardTabsFromLocalStorage(force)
    hydrateWonderLabFolderFromLocalStorage()
    hydrateWorkspaceSheetOpenFromLocalStorage()
  }

  function applyIconsFromSmartbar(): void {
    if (smartbarStore.icons.length) {
      items.value = normalizeIcons(smartbarStore.icons)
      syncIconsToLocalStorage()
      return
    }

    if (!items.value.length) {
      items.value = seededIcons()
      syncIconsToLocalStorage()
    }
  }

  function syncModelTypeIfNeeded(): void {
    if (!activeModelType.value && modelTypes.value.length > 0) {
      activeModelType.value = modelTypes.value[0] ?? null
    }
  }

  const dashboardTitle = computed(() => {
    return dashboardShell.value.title || 'Dashboard'
  })

  const dashboardSummary = computed(() => {
    return dashboardShell.value.summary || ''
  })

  const dashboardCards = computed(() => {
    return getModelCards(dashboardShell.value.cards)
  })

  const hasDashboardCards = computed(() => {
    return dashboardCards.value.length > 0
  })

  async function initialize(force = false): Promise<void> {
    if (initializePromise.value && !force) {
      return initializePromise.value
    }

    if (isInitialized.value && !force) {
      hydrateDashboardTabsFromLocalStorage()
      hydrateWonderLabFolderFromLocalStorage()
      hydrateWorkspaceSheetOpenFromLocalStorage()
      return
    }

    initializePromise.value = (async () => {
      try {
        isInitializing.value = true
        loading.value = true
        clearError()

        hydrateFromLocalStorage(force)

        if (!smartbarStore.isInitialized || force) {
          await smartbarStore.initialize({ force })
        }

        applyIconsFromSmartbar()
        syncModelTypeIfNeeded()

        isInitialized.value = true
      } catch (error) {
        handleError(error, 'initializing navStore')
        setLastError(error, 'Failed to initialize nav store')

        if (!items.value.length) {
          items.value = seededIcons()
          syncIconsToLocalStorage()
          syncModelTypeIfNeeded()
        }

        hydrateDashboardTabsFromLocalStorage(force)
        hydrateWonderLabFolderFromLocalStorage()
        hydrateWorkspaceSheetOpenFromLocalStorage()

        isInitialized.value = false
      } finally {
        loading.value = false
        isInitializing.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  function resetInitialization(): void {
    isInitialized.value = false
    isInitializing.value = false
    loading.value = false
    initializePromise.value = null
    lastError.value = null
  }

  function setIcons(data: SmartIcon[]): void {
    items.value = normalizeIcons(data)
    syncModelTypeIfNeeded()
    syncIconsToLocalStorage()
  }

  function refreshIconsFromSmartbar(): void {
    applyIconsFromSmartbar()
    syncModelTypeIfNeeded()
  }

  function setActiveTab(tab: NavTab): void {
    activeTab.value = tab
  }

  function setActiveModelType(modelType: string | null): void {
    activeModelType.value = modelType
  }

  function toggleFavorite(link?: string | null): void {
    const normalized = (link ?? '').trim()

    if (!normalized) return

    const index = favorites.value.indexOf(normalized)

    if (index === -1) {
      favorites.value.push(normalized)
    } else {
      favorites.value.splice(index, 1)
    }

    syncFavoritesToLocalStorage()
  }

  function setDashboardTabFromContent(tabKey?: string | null): string | null {
    const normalizedTabKey = (tabKey ?? '').trim()

    if (!normalizedTabKey) return null

    for (const dashboardKey of Object.keys(
      dashboardConfigs,
    ) as DashboardKey[]) {
      if (isDashboardTabKey(dashboardKey, normalizedTabKey)) {
        return setDashboardTab(
          dashboardKey,
          normalizedTabKey,
          `setDashboardTabFromContent received "${normalizedTabKey}"`,
        )
      }
    }

    const fallbackKey = getFallbackDashboardKey()
    const fallbackTab = getFallbackDashboardTab(fallbackKey)

    return setDashboardTab(
      fallbackKey,
      fallbackTab,
      `setDashboardTabFromContent fallback for "${normalizedTabKey}"`,
    )
  }

  function isFavorite(link?: string | null): boolean {
    const normalized = (link ?? '').trim()

    return normalized ? favorites.value.includes(normalized) : false
  }

  function getDashboardConfig(dashboardKey: DashboardKey): DashboardConfig {
    return dashboardConfigs[dashboardKey]
  }

  function getDashboardTabs(dashboardKey: DashboardKey): DashboardTabConfig[] {
    return [...dashboardConfigs[dashboardKey].tabs]
  }

  function resetDashboardTab(
    dashboardKey: DashboardKey,
    reason = 'resetDashboardTab',
  ): string {
    return setDashboardTab(
      dashboardKey,
      dashboardConfigs[dashboardKey].defaultTab,
      reason,
    )
  }

  function getDashboardActiveTabConfig(
    dashboardKey: DashboardKey,
  ): DashboardTabConfig {
    const activeTabKey = getDashboardTab(dashboardKey)

    return (
      dashboardConfigs[dashboardKey].tabs.find(
        (tab) => tab.key === activeTabKey,
      ) ?? dashboardConfigs[dashboardKey].tabs[0]
    )
  }

  function recordVisit(path: string): void {
    if (!routeHistory.value.length) {
      routeHistory.value.push(path)
      currentIndex.value = 0
      return
    }

    const current = routeHistory.value[currentIndex.value]

    if (path === current) return

    if (
      currentIndex.value < routeHistory.value.length - 1 &&
      routeHistory.value[currentIndex.value + 1] === path
    ) {
      currentIndex.value++
      return
    }

    if (
      currentIndex.value > 0 &&
      routeHistory.value[currentIndex.value - 1] === path
    ) {
      currentIndex.value--
      return
    }

    if (currentIndex.value < routeHistory.value.length - 1) {
      routeHistory.value.splice(currentIndex.value + 1)
    }

    routeHistory.value.push(path)
    currentIndex.value = routeHistory.value.length - 1
  }

  function clearRouteHistory(): void {
    routeHistory.value = []
    currentIndex.value = -1
  }

  function setWonderLabFolder(folder: string | null): void {
    wonderLabFolder.value = folder
    syncWonderLabFolderToLocalStorage()
  }

  function hydrateDashboardTabs(force = false): void {
    hydrateDashboardTabsFromLocalStorage(force)
  }

  function setWorkspaceSheetOpen(value: boolean): void {
    workspaceSheetOpen.value = value
    syncWorkspaceSheetOpenToLocalStorage()
  }

  function closeWorkspaceSheet(): void {
    setWorkspaceSheetOpen(false)
  }

  function toggleWorkspaceSheet(): void {
    setWorkspaceSheetOpen(!workspaceSheetOpen.value)
  }

  function showWorkspaceSheet(): void {
    setWorkspaceSheetOpen(true)
  }

  function hideWorkspaceSheet(): void {
    setWorkspaceSheetOpen(false)
  }

  return {
    items,
    favorites,
    activeTab,
    activeModelType,

    isInitialized,
    isInitializing,
    loading,
    lastError,
    initializePromise,

    dashboardShell,
    workspaceSheetOpen,

    routeHistory,
    currentIndex,

    dashboardTabs,
    dashboardKeys,
    dashboardList,
    wonderLabFolder,

    directoryIcons,
    modelTypes,
    favoritesIcons,

    canGoBack,
    canGoForward,
    backPath,
    forwardPath,

    syncDashboardTabs,

    initialize,
    resetInitialization,
    hydrateFromLocalStorage,
    syncToLocalStorage,
    hydrateDashboardTabs,

    setIcons,
    refreshIconsFromSmartbar,

    setActiveTab,
    setActiveModelType,

    toggleFavorite,
    isFavorite,

    getDashboardConfig,
    getDashboardTabs,
    getDashboardTab,
    setDashboardTab,
    resetDashboardTab,
    getDashboardActiveTabConfig,

    setDashboardShellFromContent,
    clearDashboardShell,
    refreshDashboardShell,

    recordVisit,
    clearRouteHistory,

    setWonderLabFolder,
    setDashboardTabFromContent,

    setWorkspaceSheetOpen,
    toggleWorkspaceSheet,
    showWorkspaceSheet,
    hideWorkspaceSheet,

    dashboardTitle,
    dashboardSummary,
    dashboardCards,
    hasDashboardCards,
    closeWorkspaceSheet,
  }
})
