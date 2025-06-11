// /stores/layoutStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export enum LayoutKey {
  Default = 'default',
  Minimal = 'minimal',
}

const LOCAL_STORAGE_KEY = 'currentLayout'
const isClient = typeof window !== 'undefined'

function getStoredLayout(defaultValue: LayoutKey): LayoutKey {
  if (isClient) {
    try {
      const storedValue = localStorage.getItem(LOCAL_STORAGE_KEY)
      return Object.values(LayoutKey).includes(storedValue as LayoutKey)
        ? (storedValue as LayoutKey)
        : defaultValue
    } catch (error) {
      console.error('Error accessing localStorage:', error)
    }
  }
  return defaultValue
}

export const useLayoutStore = defineStore('layoutStore', () => {
  const currentLayout = ref<LayoutKey>(getStoredLayout(LayoutKey.Default))
  const isSidebarOpen = ref(true)

  const getCurrentLayout = computed(() => currentLayout.value)

  function toggleSidebar() {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  function setLayout(newLayout: LayoutKey) {
    if (Object.values(LayoutKey).includes(newLayout)) {
      currentLayout.value = newLayout
      if (isClient) {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, newLayout)
        } catch (error) {
          console.error('Failed to save layout to localStorage:', error)
        }
      }
    } else {
      console.warn(`Invalid layout option: ${newLayout}`)
    }
  }

  function initializeStore() {
    currentLayout.value = getStoredLayout(LayoutKey.Default)
  }

  return {
    currentLayout,
    isSidebarOpen,
    getCurrentLayout,
    toggleSidebar,
    setLayout,
    initializeStore,
  }
})
