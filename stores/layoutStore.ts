// /stores/layoutStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const layoutKeys = ['default', 'mobile', 'tablet', 'desktop'] as const
export type LayoutKey = (typeof layoutKeys)[number]

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
  const currentLayout = ref<LayoutKey>('default')
  const isSidebarOpen = ref(true)

  const getCurrentLayout = computed(() => currentLayout.value)
  const availableLayouts = computed<LayoutKey[]>(() => [...layoutKeys])

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

  function initializeStore() {
    currentLayout.value = getStoredLayout('default')
  }

  function resetLayout() {
    setLayout('default')
  }

  return {
    currentLayout,
    isSidebarOpen,
    getCurrentLayout,
    availableLayouts,
    toggleSidebar,
    setLayout,
    initializeStore,
    resetLayout,
  }
})
