import { defineStore } from 'pinia'

export const allowedLayouts = [
  'ancient',
  'business',
  'chat',
  'classic',
  'default',
  'desktop',
  'mobile',
  'modern',
  'old',
  'simple',
  'triple-column'
]

interface LayoutState {
  currentLayout: string
  mobileLayout: string
  isInitialized: boolean
}
export const useLayoutStore = defineStore('layoutStore', {
  // State
  state: (): LayoutState => ({
    currentLayout: '', // will be set in initialize action
    mobileLayout: '', // will be set in initialize action
    isInitialized: false // new state variable to track initialization
  }),

  // Getters
  getters: {
    getCurrentLayout(): string {
      return this.currentLayout
    }
  },

  // Actions
  actions: {
    // Method to set responsive layout based on window width
    setResponsiveLayout() {
      if (!this.isInitialized) {
        if (window.innerWidth <= 800) {
          this.setLayout(this.mobileLayout, false)
        } else {
          this.setLayout(this.currentLayout, false)
        }
        this.isInitialized = true // Set to true after the initial setup
      }
    },

    // Method to set the layout with validation and local storage handling
    setLayout(newLayout: string, isUserAction = false) {
      if (allowedLayouts.includes(newLayout)) {
        this.currentLayout = newLayout

        if (isUserAction && typeof window !== 'undefined') {
          localStorage.setItem('currentLayout', newLayout)

          if (window.innerWidth <= 800) {
            this.mobileLayout = newLayout
            localStorage.setItem('mobileLayout', newLayout)
          }
        }
      } else {
        console.warn(`Invalid layout option: ${newLayout}`)
      }
    },

    // Initialization method to set up the store with values from local storage and responsive settings
    initialize() {
      if (typeof window !== 'undefined') {
        let storedCurrentLayout = localStorage.getItem('currentLayout') ?? 'default'
        let storedMobileLayout = localStorage.getItem('mobileLayout') ?? 'mobile'

        this.currentLayout = allowedLayouts.includes(storedCurrentLayout)
          ? storedCurrentLayout
          : 'default'
        this.mobileLayout = allowedLayouts.includes(storedMobileLayout)
          ? storedMobileLayout
          : 'mobile'
        this.setResponsiveLayout()
        window.addEventListener('resize', this.setResponsiveLayout)
      }
    }
  }
})

export default useLayoutStore
