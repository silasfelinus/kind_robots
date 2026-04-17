// /stores/layoutStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

export const layoutKeys = ['default', 'mobile', 'tablet', 'desktop'] as const
export type LayoutKey = (typeof layoutKeys)[number]
export type ResolvedLayoutKey = Exclude<LayoutKey, 'default'>

const LOCAL_STORAGE_KEY = 'currentLayout'

function isLayoutKey(value: unknown): value is LayoutKey {
  return typeof value === 'string' && layoutKeys.includes(value as LayoutKey)
}

function getStoredLayout(defaultValue: LayoutKey): LayoutKey {
  if (typeof window === 'undefined') return defaultValue

  try {
    const storedValue = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    return isLayoutKey(storedValue) ? storedValue : defaultValue
  } catch (error) {
    console.error('Error accessing localStorage:', error)
    return defaultValue
  }
}

export const useLayoutStore = defineStore('layoutStore', () => {
  const displayStore = useDisplayStore()

  const currentLayout = ref<LayoutKey>('default')
  const isSidebarOpen = ref(true)

  const availableLayouts = computed<LayoutKey[]>(() => [...layoutKeys])
  const isAutoLayout = computed(() => currentLayout.value === 'default')
  const getCurrentLayout = computed(() => currentLayout.value)

  const resolvedLayout = computed<ResolvedLayoutKey>(() => {
    if (currentLayout.value === 'mobile') return 'mobile'
    if (currentLayout.value === 'tablet') return 'tablet'
    if (currentLayout.value === 'desktop') return 'desktop'

    if (displayStore.viewportSize === 'small') return 'mobile'
    if (displayStore.viewportSize === 'medium') return 'tablet'
    return 'desktop'
  })

  function toggleSidebar() {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  function setLayout(newLayout: LayoutKey) {
    if (!isLayoutKey(newLayout)) {
      console.warn(`Invalid layout option: ${String(newLayout)}`)
      return
    }

    currentLayout.value = newLayout

    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, newLayout)
    } catch (error) {
      console.error('Failed to save layout to localStorage:', error)
    }
  }

  function setAutoLayout() {
    setLayout('default')
  }

  function initializeStore() {
    currentLayout.value = getStoredLayout('default')
  }

  function resetLayout() {
    setLayout('default')
  }

  return {
    currentLayout,
    isSidebarOpen,
    availableLayouts,
    isAutoLayout,
    getCurrentLayout,
    resolvedLayout,
    toggleSidebar,
    setLayout,
    setAutoLayout,
    initializeStore,
    resetLayout,
  }
})
