import { defineStore } from 'pinia'

export const allowedLayouts = ['retro', 'dashboard', 'default', 'mobile']

const getStoredLayout = (key: string, defaultValue: string): string => {
  const storedValue = localStorage.getItem(key)
  return allowedLayouts.includes(storedValue ?? '') ? storedValue! : defaultValue
}

interface LayoutState {
  currentLayout: string
}

export const useLayoutStore = defineStore('layoutStore', {
  state: (): LayoutState => ({
    currentLayout: 'default' // Initialize with a default value
  }),

  actions: {
    setLayout(newLayout: string) {
      if (allowedLayouts.includes(newLayout)) {
        this.currentLayout = newLayout
        localStorage.setItem('currentLayout', newLayout)
      } else {
        console.warn(`Invalid layout option: ${newLayout}`)
      }
    },

    initialize() {
      const storedLayout = getStoredLayout('currentLayout', 'default')
      this.setLayout(storedLayout)
    }
  }
})

export default useLayoutStore
