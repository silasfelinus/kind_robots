// /stores/navStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  dashboardConfigs,
  getDashboardDefaultTabs,
  isDashboardTabKey,
  normalizeDashboardTabs,
  type DashboardConfig,
  type DashboardKey,
  type DashboardTabConfig,
} from '@/stores/helpers/dashboardHelper'
import { useSheetStore } from '@/stores/sheetStore'

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

function getFallbackDashboardKey(): DashboardKey {
  if (fallbackDashboardKey in dashboardConfigs) {
    return fallbackDashboardKey as DashboardKey
  }

  const firstKey = Object.keys(dashboardConfigs)[0]
  return firstKey as DashboardKey
}

function getFallbackDashboardTab(dashboardKey: DashboardKey): string {
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

const dashboardTabsStorageKey = 'dashboardTabs'
const workspaceSheetOpenStorageKey = 'workspaceSheetOpen'
const workspaceHandOpenStorageKey = 'workspaceHandOpen'
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

export const useNavStore = defineStore('navStore', () => {
  const isInitialized = ref(false)
  const isInitializing = ref(false)
  const loading = ref(false)
  const lastError = ref<string | null>(null)
  let initializePromise: Promise<void> | null = null

  const dashboardShell = ref<DashboardShellState>(defaultDashboardShellState())
  const workspaceSheetOpen = ref(false)
  const workspaceHandOpen = ref(false)

  const routeHistory = ref<string[]>([])
  const currentIndex = ref(-1)

  const dashboardTabs = ref<Record<DashboardKey, string>>({
    ...getDashboardDefaultTabs(),
    [getFallbackDashboardKey()]: getFallbackDashboardTab(
      getFallbackDashboardKey(),
    ),
  })
  const dashboardTabsHydrated = ref(false)

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
  const dashboardTitle = computed(() => dashboardShell.value.title || 'Dashboard')
  const dashboardSummary = computed(() => dashboardShell.value.summary || '')

  function syncDashboardTabsToLocalStorage(reason = 'unknown'): void {
    void reason
    safeSetLocalStorage(dashboardTabsStorageKey, JSON.stringify(dashboardTabs.value))
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

  function syncWorkspaceHandOpenToLocalStorage(): void {
    safeSetLocalStorage(
      workspaceHandOpenStorageKey,
      String(workspaceHandOpen.value),
    )
  }

  function hydrateDashboardTabsFromLocalStorage(force = false): void {
    if (dashboardTabsHydrated.value && !force) return

    const parsed = safeParseRecord(safeGetLocalStorage(dashboardTabsStorageKey))
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

  function hydrateWorkspaceHandOpenFromLocalStorage(): void {
    workspaceHandOpen.value = safeParseBoolean(
      safeGetLocalStorage(workspaceHandOpenStorageKey),
      false,
    )
  }

  function hydrateFromLocalStorage(force = false): void {
    hydrateDashboardTabsFromLocalStorage(force)
    hydrateWorkspaceSheetOpenFromLocalStorage()
    hydrateWorkspaceHandOpenFromLocalStorage()
  }

  function syncToLocalStorage(): void {
    syncDashboardTabsToLocalStorage('syncToLocalStorage')
    syncWorkspaceSheetOpenToLocalStorage()
    syncWorkspaceHandOpenToLocalStorage()
  }

  async function initialize(force = false): Promise<void> {
    if (initializePromise && !force) return initializePromise

    if (isInitialized.value && !force) {
      hydrateFromLocalStorage()
      return
    }

    initializePromise = (async () => {
      try {
        isInitializing.value = true
        loading.value = true
        lastError.value = null
        hydrateFromLocalStorage(force)
        isInitialized.value = true
      } catch (error) {
        lastError.value =
          error instanceof Error ? error.message : 'Failed to initialize nav store'
        isInitialized.value = false
      } finally {
        loading.value = false
        isInitializing.value = false
        initializePromise = null
      }
    })()

    return initializePromise
  }

  function resetInitialization(): void {
    isInitialized.value = false
    isInitializing.value = false
    loading.value = false
    initializePromise = null
    lastError.value = null
  }

  function getDashboardTab(dashboardKey: DashboardKey): string {
    const config = dashboardConfigs[dashboardKey]
    const current = dashboardTabs.value[dashboardKey]
    return current && isDashboardTabKey(dashboardKey, current)
      ? current
      : config.defaultTab
  }

  function setDashboardTab(
    dashboardKey: DashboardKey,
    tabKey: string,
    reason = 'unknown',
  ): string {
    const previous = dashboardTabs.value[dashboardKey]
    const nextTab = resolveDashboardTab(dashboardKey, tabKey)

    if (previous === nextTab) return nextTab

    dashboardTabs.value = {
      ...dashboardTabs.value,
      [dashboardKey]: nextTab,
    }
    syncDashboardTabsToLocalStorage(
      `setDashboardTab(${dashboardKey}, ${nextTab}) from ${reason}`,
    )

    const tabConfig = dashboardConfigs[dashboardKey]?.tabs.find(
      (tab) => tab.key === nextTab,
    )
    if (tabConfig) useSheetStore().setSheetFromTab(tabConfig)

    return nextTab
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
    return setDashboardTab(
      fallbackKey,
      getFallbackDashboardTab(fallbackKey),
      `setDashboardTabFromContent fallback for "${normalizedTabKey}"`,
    )
  }

  function setDashboardShellFromContent(input: ContentDashboardInput): void {
    const dashboardKey = resolveDashboardKey(input.dashboardKey)
    const requestedTab = (input.dashboardTab ?? '').trim()
    const activeTabHint =
      requestedTab && isDashboardTabKey(dashboardKey, requestedTab)
        ? requestedTab
        : getDashboardTab(dashboardKey)
    const resolvedTab = setDashboardTab(
      dashboardKey,
      activeTabHint,
      'content frontmatter',
    )

    dashboardShell.value = {
      enabled: true,
      dashboardKey,
      activeTabHint: resolvedTab,
      cards: (input.cards ?? '').trim() || null,
      title: input.title?.trim() || input.subtitle?.trim() || 'Dashboard',
      summary: input.summary?.trim() || input.description?.trim() || '',
      loadingMessage: input.loadingMessage?.trim() || 'Loading dashboard…',
      refreshLabel: input.refreshLabel?.trim() || 'Refresh',
    }

    const tabConfig = dashboardConfigs[dashboardKey].tabs.find(
      (tab) => tab.key === resolvedTab,
    )
    if (tabConfig) useSheetStore().setSheetFromTab(tabConfig)
  }

  function clearDashboardShell(): void {
    dashboardShell.value = defaultDashboardShellState()
    setDashboardTab(
      dashboardShell.value.dashboardKey,
      dashboardShell.value.activeTabHint,
      'clearDashboardShell fallback',
    )
  }

  async function refreshDashboardShell(): Promise<void> {
    await initialize(true)
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

  function hydrateDashboardTabs(force = false): void {
    hydrateDashboardTabsFromLocalStorage(force)
  }

  function setWorkspaceSheetOpen(value: boolean): void {
    workspaceSheetOpen.value = value
    syncWorkspaceSheetOpenToLocalStorage()
  }

  function setWorkspaceHandOpen(value: boolean): void {
    workspaceHandOpen.value = value
    syncWorkspaceHandOpenToLocalStorage()
  }

  function toggleWorkspaceHand(): void {
    setWorkspaceHandOpen(!workspaceHandOpen.value)
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

  function openWorkspaceSheet(): void {
    setWorkspaceSheetOpen(true)
  }

  return {
    isInitialized,
    isInitializing,
    loading,
    lastError,
    dashboardShell,
    workspaceSheetOpen,
    workspaceHandOpen,
    routeHistory,
    currentIndex,
    dashboardTabs,
    dashboardKeys,
    dashboardList,
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
    setDashboardTabFromContent,
    setWorkspaceSheetOpen,
    toggleWorkspaceSheet,
    setWorkspaceHandOpen,
    toggleWorkspaceHand,
    showWorkspaceSheet,
    hideWorkspaceSheet,
    dashboardTitle,
    dashboardSummary,
    closeWorkspaceSheet,
    openWorkspaceSheet,
  }
})
