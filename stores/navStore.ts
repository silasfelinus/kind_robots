// /stores/navStore.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { performFetch, handleError } from '@/stores/utils'
import type { SmartIcon } from '~/prisma/generated/prisma/client'
import smartIconSeeds from '@/stores/seeds/smartIcons.json'

export type NavTab = 'favorites' | 'navigation' | 'all'

export const useNavStore = defineStore('navStore', () => {
  // --- CORE STATE ---
  const items = ref<SmartIcon[]>([])
  const favorites = ref<string[]>([])
  const activeTab = ref<NavTab>('navigation')
  const activeModelType = ref<string | null>(null)
  const isInitialized = ref(false)
  const loading = ref(false)

  // --- ROUTE HISTORY STATE ---
  const routeHistory = ref<string[]>([])
  const currentIndex = ref<number>(-1)

  // --- COMPUTED: SmartIcon Data ---
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

  // --- LOCAL STORAGE SYNC ---
  function syncToLocalStorage() {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('navIcons', JSON.stringify(items.value))
      localStorage.setItem('navFavorites', JSON.stringify(favorites.value))
    } catch (error) {
      console.error('[navStore] localStorage sync error:', error)
    }
  }

  function hydrateFromLocalStorage() {
    if (typeof window === 'undefined') return
    try {
      const rawIcons = localStorage.getItem('navIcons')
      const rawFavorites = localStorage.getItem('navFavorites')

      if (rawIcons) {
        const parsedIcons = JSON.parse(rawIcons)
        if (Array.isArray(parsedIcons)) {
          items.value = parsedIcons as SmartIcon[]
        }
      }

      if (rawFavorites) {
        const parsedFavs = JSON.parse(rawFavorites)
        if (Array.isArray(parsedFavs)) {
          favorites.value = parsedFavs as string[]
        }
      }
    } catch (error) {
      console.error('[navStore] localStorage hydrate error:', error)
    }
  }

  if (typeof window !== 'undefined') {
    hydrateFromLocalStorage()

    watch(
      favorites,
      () => {
        syncToLocalStorage()
      },
      { deep: true },
    )
  }

  // --- FETCHING SMARTICONS ---
  async function fetchAllIcons(): Promise<SmartIcon[]> {
    loading.value = true
    try {
      const res = await performFetch<SmartIcon[]>('/api/icons')

      if (res.success && res.data && res.data.length > 0) {
        items.value = res.data
        syncToLocalStorage()
        return res.data
      }

      return []
    } catch (error) {
      handleError(error, 'fetching SmartIcons')
      return []
    } finally {
      loading.value = false
    }
  }

  async function initialize() {
    if (isInitialized.value) return

    try {
      hydrateFromLocalStorage()

      const fetched = await fetchAllIcons()

      if (!fetched || fetched.length === 0) {
        console.warn(
          '[navStore] No SmartIcons from API, falling back to seeds/smartIcons.json',
        )
        items.value = (smartIconSeeds as unknown as SmartIcon[]).map(
          (icon) => ({
            ...icon,
            type: (icon as any).type || 'directory',
          }),
        )
        syncToLocalStorage()
      }

      if (!activeModelType.value && modelTypes.value.length > 0) {
        activeModelType.value = modelTypes.value[0]
      }

      isInitialized.value = true
    } catch (error) {
      handleError(error, 'initializing navStore')

      if (!items.value.length) {
        try {
          items.value = (smartIconSeeds as unknown as SmartIcon[]).map(
            (icon) => ({
              ...icon,
              type: (icon as any).type || 'directory',
            }),
          )
          syncToLocalStorage()
        } catch (seedError) {
          console.error('[navStore] seed fallback error:', seedError)
        }
      }
    }
  }

  // --- FAVORITES ---
  function toggleFavorite(link?: string | null) {
    const normalized = (link ?? '').trim()
    if (!normalized) return

    const idx = favorites.value.indexOf(normalized)
    if (idx === -1) {
      favorites.value.push(normalized)
    } else {
      favorites.value.splice(idx, 1)
    }
    syncToLocalStorage()
  }

  function isFavorite(link?: string | null) {
    const normalized = (link ?? '').trim()
    if (!normalized) return false
    return favorites.value.includes(normalized)
  }

  // --- UI HELPERS ---
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
      activeModelType.value = modelTypes.value[0]
    }
  }

  // =====================================================
  // 🧭 ROUTE HISTORY TRACKING
  // =====================================================

  function recordVisit(path: string) {
    if (routeHistory.value.length === 0) {
      routeHistory.value.push(path)
      currentIndex.value = 0
      return
    }

    const currentPath = routeHistory.value[currentIndex.value]

    if (path === currentPath) return

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

  const backPath = computed<string | null>(() =>
    canGoBack.value ? routeHistory.value[currentIndex.value - 1] : null,
  )

  const forwardPath = computed<string | null>(() =>
    canGoForward.value ? routeHistory.value[currentIndex.value + 1] : null,
  )

  // =====================================================
  // EXPORT
  // =====================================================
  return {
    // --- state ---
    items,
    favorites,
    activeTab,
    activeModelType,
    isInitialized,
    loading,

    // --- SmartIcon computed ---
    directoryIcons,
    modelTypes,
    favoritesIcons,

    // --- history state ---
    routeHistory,
    currentIndex,
    backPath,
    forwardPath,
    canGoBack,
    canGoForward,

    // --- actions ---
    initialize,
    fetchAllIcons,
    toggleFavorite,
    isFavorite,
    setActiveTab,
    setActiveModelType,
    setIcons,
    syncToLocalStorage,
    recordVisit,
  }
})
