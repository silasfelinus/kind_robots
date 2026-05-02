// /stores/navStore.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { SmartIcon } from '~/prisma/generated/prisma/client'
import smartIconSeeds from '@/stores/seeds/smartIcons.json'
import { useSmartbarStore } from '@/stores/smartbarStore'
import { handleError } from '@/stores/utils'

export type NavTab = 'favorites' | 'navigation' | 'all'

export type UserDashboardTab =
  | 'dashboard'
  | 'subscription'
  | 'milestones'
  | 'servers'
  | 'themes'
  | 'chats'
  | 'galleries'

export type DreamDashboardTab =
  | 'cockpit'
  | 'gallery'
  | 'prompts'
  | 'collections'
  | 'servers'
  | 'settings'

export type WonderDashboardTab =
  | 'memory-test'
  | 'memory-dungeon'
  | 'wonder-lab'
  | 'screen-fx'
  | 'rebel-button'

export type FooterDashboardTab =
  | 'fx'
  | 'kind'
  | 'art'
  | 'story'
  | 'theme'
  | 'user'
  | 'lab'
  | 'brainstorm'
  | 'giftshop'
  | 'dream'

const navIconsStorageKey = 'navIcons'
const navFavoritesStorageKey = 'navFavorites'
const userDashboardTabStorageKey = 'userDashboardTab'
const wonderDashboardTabStorageKey = 'wonderDashboardTab'
const wonderLabFolderStorageKey = 'wonderLabFolder'
const footerDashboardTabStorageKey = 'footerDashboardTab'
const dreamDashboardTabStorageKey = 'dreamDashboardTab'

const isClient = typeof window !== 'undefined'

function safeGetLocalStorage(key: string): string | null {
  if (!isClient) return null

  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function isDreamDashboardTab(value: string | null): value is DreamDashboardTab {
  return (
    value === 'cockpit' ||
    value === 'gallery' ||
    value === 'prompts' ||
    value === 'collections' ||
    value === 'servers' ||
    value === 'settings'
  )
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

function isFooterDashboardTab(
  value: string | null,
): value is FooterDashboardTab {
  return (
    value === 'fx' ||
    value === 'kind' ||
    value === 'art' ||
    value === 'story' ||
    value === 'theme' ||
    value === 'user' ||
    value === 'lab' ||
    value === 'brainstorm' ||
    value === 'giftshop'
  )
}

function isWonderDashboardTab(
  value: string | null,
): value is WonderDashboardTab {
  return (
    value === 'memory-test' ||
    value === 'wonder-lab' ||
    value === 'screen-fx' ||
    value === 'rebel-button'
  )
}

function isUserDashboardTab(value: string | null): value is UserDashboardTab {
  return (
    value === 'dashboard' ||
    value === 'subscription' ||
    value === 'milestones' ||
    value === 'servers' ||
    value === 'themes' ||
    value === 'chats' ||
    value === 'galleries'
  )
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

  const routeHistory = ref<string[]>([])
  const currentIndex = ref<number>(-1)

  const userDashboardTab = ref<UserDashboardTab>('dashboard')
  const footerDashboardTab = ref<FooterDashboardTab>('fx')
  const wonderDashboardTab = ref<WonderDashboardTab>('memory-test')
  const wonderLabFolder = ref<string | null>(null)
  const dreamDashboardTab = ref<DreamDashboardTab>('cockpit')

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
    const favSet = new Set(favorites.value)

    return directoryIcons.value.filter((icon) => {
      const link = (icon.link ?? '').trim()
      return link.length > 0 && favSet.has(link)
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

  function setLastError(error: unknown, fallback: string): void {
    lastError.value = error instanceof Error ? error.message : fallback
  }

  function clearError(): void {
    lastError.value = null
  }

  function syncToLocalStorage() {
    safeSetLocalStorage(navIconsStorageKey, JSON.stringify(items.value))
    safeSetLocalStorage(navFavoritesStorageKey, JSON.stringify(favorites.value))
    safeSetLocalStorage(userDashboardTabStorageKey, userDashboardTab.value)
    safeSetLocalStorage(wonderDashboardTabStorageKey, wonderDashboardTab.value)
    safeSetLocalStorage(wonderLabFolderStorageKey, wonderLabFolder.value ?? '')
    safeSetLocalStorage(footerDashboardTabStorageKey, footerDashboardTab.value)
    safeSetLocalStorage(dreamDashboardTabStorageKey, dreamDashboardTab.value)
  }

  function hydrateFromLocalStorage() {
    const storedIcons = safeParseArray<SmartIcon>(
      safeGetLocalStorage(navIconsStorageKey),
    )

    if (storedIcons.length) {
      items.value = normalizeIcons(storedIcons)
    }

    favorites.value = safeParseArray<string>(
      safeGetLocalStorage(navFavoritesStorageKey),
    )

    const storedDreamDashboardTab = safeGetLocalStorage(
      dreamDashboardTabStorageKey,
    )

    if (isDreamDashboardTab(storedDreamDashboardTab)) {
      dreamDashboardTab.value = storedDreamDashboardTab
    }

    const storedUserDashboardTab = safeGetLocalStorage(
      userDashboardTabStorageKey,
    )

    if (isUserDashboardTab(storedUserDashboardTab)) {
      userDashboardTab.value = storedUserDashboardTab
    }

    const storedFooterDashboardTab = safeGetLocalStorage(
      footerDashboardTabStorageKey,
    )

    if (isFooterDashboardTab(storedFooterDashboardTab)) {
      footerDashboardTab.value = storedFooterDashboardTab
    }

    const storedWonderDashboardTab = safeGetLocalStorage(
      wonderDashboardTabStorageKey,
    )

    if (isWonderDashboardTab(storedWonderDashboardTab)) {
      wonderDashboardTab.value = storedWonderDashboardTab
    }

    wonderLabFolder.value =
      safeGetLocalStorage(wonderLabFolderStorageKey) || null
  }

  function applyIconsFromSmartbar(): void {
    if (smartbarStore.icons.length) {
      items.value = normalizeIcons(smartbarStore.icons)
      syncToLocalStorage()
      return
    }

    if (!items.value.length) {
      items.value = seededIcons()
      syncToLocalStorage()
    }
  }

  function setDreamDashboardTab(tab: DreamDashboardTab) {
    dreamDashboardTab.value = tab
    syncToLocalStorage()
  }

  function syncModelTypeIfNeeded(): void {
    if (!activeModelType.value && modelTypes.value.length > 0) {
      activeModelType.value = modelTypes.value[0] ?? null
    }
  }

  async function initialize(force = false): Promise<void> {
    if (isInitialized.value && !force) return
    if (initializePromise.value && !force) return initializePromise.value

    initializePromise.value = (async () => {
      try {
        isInitializing.value = true
        loading.value = true
        clearError()

        hydrateFromLocalStorage()

        if (!smartbarStore.isInitialized) {
          await smartbarStore.initialize()
        }

        applyIconsFromSmartbar()
        syncModelTypeIfNeeded()

        isInitialized.value = true
      } catch (error) {
        handleError(error, 'initializing navStore')
        setLastError(error, 'Failed to initialize nav store')

        if (!items.value.length) {
          items.value = seededIcons()
          syncToLocalStorage()
          syncModelTypeIfNeeded()
        }

        isInitialized.value = false
      } finally {
        loading.value = false
        isInitializing.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  function setIcons(data: SmartIcon[]) {
    items.value = normalizeIcons(data)
    syncToLocalStorage()
    syncModelTypeIfNeeded()
  }

  function refreshIconsFromSmartbar() {
    applyIconsFromSmartbar()
    syncModelTypeIfNeeded()
  }

  function toggleFavorite(link?: string | null) {
    const normalized = (link ?? '').trim()
    if (!normalized) return

    const index = favorites.value.indexOf(normalized)

    if (index === -1) {
      favorites.value.push(normalized)
    } else {
      favorites.value.splice(index, 1)
    }

    syncToLocalStorage()
  }

  function isFavorite(link?: string | null) {
    const normalized = (link ?? '').trim()
    return normalized ? favorites.value.includes(normalized) : false
  }

  function setActiveTab(tab: NavTab) {
    activeTab.value = tab
  }

  function setActiveModelType(modelType: string | null) {
    activeModelType.value = modelType
  }

  function setUserDashboardTab(tab: UserDashboardTab) {
    userDashboardTab.value = tab
    syncToLocalStorage()
  }

  function setFooterDashboardTab(tab: FooterDashboardTab) {
    footerDashboardTab.value = tab
    syncToLocalStorage()
  }

  function setWonderDashboardTab(tab: WonderDashboardTab) {
    wonderDashboardTab.value = tab
    syncToLocalStorage()
  }

  function setWonderLabFolder(folder: string | null) {
    wonderLabFolder.value = folder
    syncToLocalStorage()
  }

  function recordVisit(path: string) {
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

  function resetInitialization() {
    isInitialized.value = false
    isInitializing.value = false
    initializePromise.value = null
    lastError.value = null
  }

  if (isClient) {
    hydrateFromLocalStorage()

    watch(favorites, () => syncToLocalStorage(), { deep: true })
    watch(userDashboardTab, () => syncToLocalStorage())
    watch(wonderDashboardTab, () => syncToLocalStorage())
    watch(wonderLabFolder, () => syncToLocalStorage())
    watch(footerDashboardTab, () => syncToLocalStorage())
    watch(dreamDashboardTab, () => syncToLocalStorage())
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

    directoryIcons,
    modelTypes,
    favoritesIcons,

    routeHistory,
    currentIndex,
    backPath,
    forwardPath,
    canGoBack,
    canGoForward,

    userDashboardTab,
    wonderDashboardTab,
    wonderLabFolder,
    footerDashboardTab,

    initialize,
    resetInitialization,
    refreshIconsFromSmartbar,
    toggleFavorite,
    isFavorite,
    setActiveTab,
    setActiveModelType,
    setIcons,
    syncToLocalStorage,
    hydrateFromLocalStorage,
    recordVisit,
    setUserDashboardTab,
    setWonderDashboardTab,
    setWonderLabFolder,
    setFooterDashboardTab,
    dreamDashboardTab,
    setDreamDashboardTab,
  }
})
