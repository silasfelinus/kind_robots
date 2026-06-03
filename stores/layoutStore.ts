// /stores/layoutStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const layoutKeys = ['default'] as const

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
    console.error('Error accessing layout localStorage:', error)
    return defaultValue
  }
}

function saveStoredLayout(layout: LayoutKey): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, layout)
  } catch (error) {
    console.error('Failed to save layout to localStorage:', error)
  }
}

export const useLayoutStore = defineStore('layoutStore', () => {
  const currentLayout = ref<LayoutKey>('default')
  const isSidebarOpen = ref(true)
  const isInitialized = ref(false)

  const availableLayouts = computed<LayoutKey[]>(() => [...layoutKeys])

  const isDefaultLayout = computed(() => currentLayout.value === 'default')

  const layoutName = computed<LayoutKey>(() => currentLayout.value)

  function toggleSidebar(): void {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  function setSidebarOpen(value: boolean): void {
    isSidebarOpen.value = value
  }

  function setLayout(newLayout: LayoutKey): void {
    if (!isLayoutKey(newLayout)) {
      console.warn(`Invalid layout option: ${String(newLayout)}`)
      return
    }

    currentLayout.value = newLayout
    saveStoredLayout(newLayout)
  }

  function setDefaultLayout(): void {
    setLayout('default')
  }

  function initializeStore(): void {
    if (isInitialized.value) return

    currentLayout.value = getStoredLayout('default')
    isInitialized.value = true
  }

  function resetLayout(): void {
    setLayout('default')
  }

  return {
    currentLayout,
    isSidebarOpen,
    isInitialized,

    availableLayouts,
    isDefaultLayout,
    layoutName,

    toggleSidebar,
    setSidebarOpen,
    setLayout,
    setDefaultLayout,
    initializeStore,
    resetLayout,
  }
})
