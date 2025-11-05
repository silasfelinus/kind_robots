// /stores/navStore.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { performFetch, handleError } from '@/stores/utils'
import type { SmartIcon } from '@prisma/client'
import smartIconSeeds from '@/stores/seeds/smartIcons.json'

export type NavTab = 'favorites' | 'navigation' | 'all'

export const useNavStore = defineStore('navStore', () => {
  const items = ref<SmartIcon[]>([])
  const favorites = ref<string[]>([])
  const activeTab = ref<NavTab>('navigation')
  const activeModelType = ref<string | null>(null)
  const isInitialized = ref(false)
  const loading = ref(false)

  // --- COMPUTED ---

  const directoryIcons = computed(() =>
    items.value.filter((icon) => icon.type === 'directory'),
  )

  const modelTypes = computed(() => {
    const set = new Set<string>()
    for (const icon of directoryIcons.value) {
      if (icon.modelType && icon.category === 'model') {
        set.add(icon.modelType)
      }
    }
    return Array.from(set).sort()
  })

  const favoritesIcons = computed(() => {
    const favSet = new Set(favorites.value)
    return directoryIcons.value.filter(
      (icon) => icon.link && favSet.has(icon.link),
    )
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
          items.value = parsedIcons
        }
      }

      if (rawFavorites) {
        const parsedFavs = JSON.parse(rawFavorites)
        if (Array.isArray(parsedFavs)) {
          favorites.value = parsedFavs
        }
      }
    } catch (error) {
      console.error('[navStore] localStorage hydrate error:', error)
    }
  }

  if (typeof window !== 'undefined') {
    // hydrate favorites + any cached icons once
    hydrateFromLocalStorage()

    // persist favorites on change
    watch(
      favorites,
      () => {
        syncToLocalStorage()
      },
      { deep: true },
    )
  }

  // --- API + SEED LOADING ---

  async function fetchAllIcons(): Promise<SmartIcon[]> {
    loading.value = true
    try {
      const res = await performFetch<SmartIcon[]>('/api/smartIcons')

      if (res.success && res.data && res.data.length > 0) {
        items.value = res.data
        syncToLocalStorage()
        return res.data
      }

      // No data from API
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
      // Use any cached values from localStorage first
      hydrateFromLocalStorage()

      const fetched = await fetchAllIcons()

      if (!fetched || fetched.length === 0) {
        console.warn(
          '[navStore] No SmartIcons from API, falling back to seeds/smartIcons.json',
        )
        // Seed fallback (JSON backup)
        items.value = (smartIconSeeds as unknown as SmartIcon[]).map(
          (icon) => ({
            ...icon,
            // ensure type is at least "directory" for these
            type: icon.type || 'directory',
          }),
        )
        syncToLocalStorage()
      }

      // Default active model type if not set
      if (!activeModelType.value && modelTypes.value.length > 0) {
        activeModelType.value = modelTypes.value[0]
      }

      isInitialized.value = true
    } catch (error) {
      handleError(error, 'initializing navStore')

      // last-resort fallback to seeds if nothing has loaded
      if (!items.value.length) {
        try {
          items.value = (smartIconSeeds as unknown as SmartIcon[]).map(
            (icon) => ({
              ...icon,
              type: icon.type || 'directory',
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
    if (!link) return
    const idx = favorites.value.indexOf(link)
    if (idx === -1) {
      favorites.value.push(link)
    } else {
      favorites.value.splice(idx, 1)
    }
    syncToLocalStorage()
  }

  function isFavorite(link?: string | null) {
    if (!link) return false
    return favorites.value.includes(link)
  }

  // --- UI STATE HELPERS ---

  function setActiveTab(tab: NavTab) {
    activeTab.value = tab
  }

  function setActiveModelType(modelType: string | null) {
    activeModelType.value = modelType
  }

  // Optional helper so you can manually inject a list
  function setIcons(data: SmartIcon[]) {
    items.value = data
    syncToLocalStorage()

    if (!activeModelType.value && modelTypes.value.length > 0) {
      activeModelType.value = modelTypes.value[0]
    }
  }

  return {
    // state
    items,
    favorites,
    activeTab,
    activeModelType,
    isInitialized,
    loading,

    // computed
    directoryIcons,
    modelTypes,
    favoritesIcons,

    // actions
    initialize,
    fetchAllIcons,
    toggleFavorite,
    isFavorite,
    setActiveTab,
    setActiveModelType,
    setIcons,
    syncToLocalStorage,
  }
})
