// ~/stores/layoutStore.ts
import { defineStore } from 'pinia'

export const allowedLayouts = [
  'ancient',
  'art',
  'base',
  'business',
  'button',
  'chat',
  'default',
  'desktop',
  'mobile',
  'modern',
  'old',
  'simple',
  'tv'
]

interface LayoutState {
  currentLayout: string
}

export const useLayoutStore = defineStore({
  id: 'layoutStore',
  state: (): LayoutState => ({
    currentLayout: 'default'
  }),
  getters: {
    getCurrentLayout(): string {
      return this.currentLayout
    }
  },
  actions: {
    initialize() {
      if (window.innerWidth <= 800) {
        this.setLayout('simple')
      } else {
        this.setLayout('default')
      }
    },
    setLayout(newLayout: string) {
      // Use LayoutKey here
      if (allowedLayouts.includes(newLayout)) {
        this.currentLayout = newLayout
      } else {
        console.warn(`Invalid layout option: ${newLayout}`)
      }
    }
  }
})

export default useLayoutStore
