import { defineStore } from 'pinia'

// Using enum for layout keys
export enum LayoutKey {
  Default = 'default',
  DefaultOld = 'default-old',
  SinglePage = 'single-page',
  Dashboard = 'dashboard',
  Smart = 'smart',
  VerticalScroll = 'vertical-scroll',
  Mobile = 'mobile',
  Tablet = 'tablet',
  Desktop = 'desktop',
}

const LOCAL_STORAGE_KEY = 'currentLayout'

function getStoredLayout(defaultValue: LayoutKey): LayoutKey {
  if (import.meta.client) {
    try {
      const storedValue = localStorage.getItem(LOCAL_STORAGE_KEY)
      return Object.values(LayoutKey).includes(storedValue as LayoutKey)
        ? (storedValue as LayoutKey)
        : defaultValue
    } catch (error) {
      console.error('Error accessing localStorage:', error)
      return defaultValue
    }
  }
  return defaultValue
}

interface LayoutState {
  currentLayout: LayoutKey
  isSidebarOpen: boolean
}

export const useLayoutStore = defineStore('layoutStore', {
  state: (): LayoutState => ({
    currentLayout: getStoredLayout(LayoutKey.Dashboard),
    isSidebarOpen: true,
  }),

  actions: {
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen
    },
    setLayout(newLayout: LayoutKey) {
      if (Object.values(LayoutKey).includes(newLayout)) {
        this.currentLayout = newLayout
        if (import.meta.client) {
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, newLayout)
          } catch (error) {
            console.error('Failed to save layout to localStorage:', error)
          }
        }
      } else {
        console.warn(`Invalid layout option: ${newLayout}`)
      }
    },
    initializeStore() {
      this.currentLayout = getStoredLayout(LayoutKey.Dashboard)
    },
  },

  getters: {
    getCurrentLayout: (state) => state.currentLayout,
  },
})
