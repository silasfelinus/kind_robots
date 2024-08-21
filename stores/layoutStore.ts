import { defineStore } from 'pinia'

// Define the possible layout keys
export type LayoutKey =
  | 'default'
  | 'default-old'
  | 'single-page'
  | 'dashboard'
  | 'smart'
  | 'vertical-scroll'

// Array of allowed layout keys for validation
export const allowedLayouts: LayoutKey[] = [
  'default',
  'default-old',
  'single-page',
  'dashboard',
  'smart',
  'vertical-scroll',
]

// Function to get the layout from local storage and validate it
const getStoredLayout = (key: string, defaultValue: LayoutKey): LayoutKey => {
  if (import.meta.client) {
    const storedValue = localStorage.getItem(key)
    // Ensure that the value is either a valid layout key or the default value
    return allowedLayouts.includes(storedValue as LayoutKey)
      ? (storedValue as LayoutKey)
      : defaultValue
  }
  return defaultValue
}

interface LayoutState {
  currentLayout: LayoutKey
}

export const useLayoutStore = defineStore({
  id: 'layoutStore',
  state: (): LayoutState => ({
    currentLayout: getStoredLayout('currentLayout', 'dashboard'),
  }),

  actions: {
    setLayout(newLayout: LayoutKey) {
      if (allowedLayouts.includes(newLayout)) {
        this.currentLayout = newLayout
        if (import.meta.client) {
          localStorage.setItem('currentLayout', newLayout)
          console.log('current layout is  ' + this.currentLayout)
        }
      } else {
        console.warn(`Invalid layout option: ${newLayout}`)
      }
    },
    initializeStore() {
      return (this.currentLayout = getStoredLayout(
        'currentLayout',
        'dashboard',
      ))
    },
  },

  getters: {
    // Optional getter to access the current layout
    getCurrentLayout: (state) => state.currentLayout,
  },
})
