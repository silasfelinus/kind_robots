// /stores/navStore.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { performFetch, handleError } from '@/stores/utils'
import type { SmartIcon } from '~/prisma/generated/prisma/client'
import smartIconSeeds from '@/stores/seeds/smartIcons.json'

export type NavTab = 'favorites' | 'navigation' | 'all'

export type UserDashboardTab =
  | 'dashboard'
  | 'subscription'
  | 'milestones'
  | 'servers'
  | 'themes'
  | 'chats'
  | 'galleries'

export type WonderDashboardTab = 'memory' | 'button' | 'wonderlab' | 'screenfx'

export const useNavStore = defineStore('navStore', () => {
  const items = ref<SmartIcon[]>([])
  const favorites = ref<string[]>([])
  const activeTab = ref<NavTab>('navigation')
  const activeModelType = ref<string | null>(null)
  const isInitialized = ref(false)
  const loading = ref(false)

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchIconsPromise = ref<Promise<SmartIcon[]> | null>(null)

  const routeHistory = ref<string[]>([])
  const currentIndex = ref<number>(-1)

  const directoryIcons = computed(() =>
    items.value.filter((icon) => (icon.type ?? 'directory') === 'directory'),
  )

  const userDashboardTab = ref<UserDashboardTab>('dashboard')

  function setUserDashboardTab(tab: UserDashboardTab) {
    userDashboardTab.value = tab
    syncToLocalStorage()
  }

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

  const wonderDashboardTab = ref<WonderDashboardTab>('memory')
  const wonderLabFolder = ref<string | null>(null)

  function setWonderDashboardTab(tab: WonderDashboardTab) {
    wonderDashboardTab.value = tab
    syncToLocalStorage()
  }

  function setWonderLabFolder(folder: string | null) {
    wonderLabFolder.value = folder
    syncToLocalStorage()
  }

  function syncToLocalStorage() {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('navIcons', JSON.stringify(items.value))
      localStorage.setItem('navFavorites', JSON.stringify(favorites.value))
      localStorage.setItem('userDashboardTab', userDashboardTab.value)
      localStorage.setItem('wonderDashboardTab', wonderDashboardTab.value)
      localStorage.setItem('wonderLabFolder', wonderLabFolder.value ?? '')
    } catch {}
  }

  function hydrateFromLocalStorage() {
    if (typeof window === 'undefined') return

    try {
      const rawIcons = localStorage.getItem('navIcons')
      const rawFavorites = localStorage.getItem('navFavorites')

      const rawUserDashboardTab = localStorage.getItem('userDashboardTab')

      if (
        rawUserDashboardTab === 'dashboard' ||
        rawUserDashboardTab === 'subscription' ||
        rawUserDashboardTab === 'milestones' ||
        rawUserDashboardTab === 'servers' ||
        rawUserDashboardTab === 'themes' ||
        rawUserDashboardTab === 'chats' ||
        rawUserDashboardTab === 'galleries'
      ) {
        userDashboardTab.value = rawUserDashboardTab
      }

      const rawWonderDashboardTab = localStorage.getItem('wonderDashboardTab')
      const rawWonderLabFolder = localStorage.getItem('wonderLabFolder')

      if (
        rawWonderDashboardTab === 'memory' ||
        rawWonderDashboardTab === 'button' ||
        rawWonderDashboardTab === 'wonderlab' ||
        rawWonderDashboardTab === 'screenfx'
      ) {
        wonderDashboardTab.value = rawWonderDashboardTab
      }

      wonderLabFolder.value = rawWonderLabFolder || null

      if (rawIcons) {
        const parsed = JSON.parse(rawIcons)
        if (Array.isArray(parsed)) {
          items.value = parsed
        }
      }

      if (rawFavorites) {
        const parsed = JSON.parse(rawFavorites)
        if (Array.isArray(parsed)) {
          favorites.value = parsed
        }
      }
    } catch {}
  }

  if (typeof window !== 'undefined') {
    hydrateFromLocalStorage()

    watch(favorites, () => syncToLocalStorage(), { deep: true })
  }

  watch(userDashboardTab, () => syncToLocalStorage())
  watch(wonderDashboardTab, () => syncToLocalStorage())
  watch(wonderLabFolder, () => syncToLocalStorage())

  async function fetchAllIcons(force = false): Promise<SmartIcon[]> {
    if (!force && items.value.length) {
      return items.value
    }

    if (fetchIconsPromise.value) {
      return fetchIconsPromise.value
    }

    fetchIconsPromise.value = (async () => {
      loading.value = true

      try {
        const res = await performFetch<SmartIcon[]>('/api/icons')

        if (res.success && res.data?.length) {
          items.value = res.data
          syncToLocalStorage()
          return items.value
        }

        return []
      } catch (error) {
        handleError(error, 'fetching SmartIcons')
        return []
      } finally {
        loading.value = false
        fetchIconsPromise.value = null
      }
    })()

    return fetchIconsPromise.value
  }

  async function initialize(): Promise<void> {
    if (isInitialized.value) return
    if (initializePromise.value) return initializePromise.value

    initializePromise.value = (async () => {
      try {
        hydrateFromLocalStorage()

        if (!items.value.length) {
          const fetched = await fetchAllIcons()

          if (!fetched.length) {
            items.value = (smartIconSeeds as SmartIcon[]).map((icon) => ({
              ...icon,
              type: (icon as any).type || 'directory',
            }))
            syncToLocalStorage()
          }
        }

        if (!activeModelType.value && modelTypes.value.length > 0) {
          activeModelType.value = modelTypes.value[0] ?? null
        }

        isInitialized.value = true
      } catch (error) {
        handleError(error, 'initializing navStore')

        if (!items.value.length) {
          items.value = (smartIconSeeds as SmartIcon[]).map((icon) => ({
            ...icon,
            type: (icon as any).type || 'directory',
          }))
          syncToLocalStorage()
        }
      } finally {
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  function toggleFavorite(link?: string | null) {
    const normalized = (link ?? '').trim()
    if (!normalized) return

    const idx = favorites.value.indexOf(normalized)
    if (idx === -1) favorites.value.push(normalized)
    else favorites.value.splice(idx, 1)

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

  function setIcons(data: SmartIcon[]) {
    items.value = data
    syncToLocalStorage()

    if (!activeModelType.value && modelTypes.value.length > 0) {
      activeModelType.value = modelTypes.value[0] ?? null
    }
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

  return {
    items,
    favorites,
    activeTab,
    activeModelType,
    isInitialized,
    loading,
    directoryIcons,
    modelTypes,
    favoritesIcons,
    routeHistory,
    currentIndex,
    backPath,
    forwardPath,
    canGoBack,
    canGoForward,
    initialize,
    fetchAllIcons,
    toggleFavorite,
    isFavorite,
    setActiveTab,
    setActiveModelType,
    setIcons,
    syncToLocalStorage,
    recordVisit,
    userDashboardTab,
    setUserDashboardTab,
    wonderDashboardTab,
    wonderLabFolder,
    setWonderDashboardTab,
    setWonderLabFolder,
  }
})
