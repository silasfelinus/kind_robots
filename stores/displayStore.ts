import { defineStore } from 'pinia'

// Define the type for possible display states
export type DisplayState = 'open' | 'compact' | 'hidden' | 'disabled'

// Define the interface for the store's state
interface DisplayStoreState {
  headerState: DisplayState
  sidebarLeft: DisplayState
  sidebarRight: DisplayState
  footer: DisplayState
  focusedContainer: 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer' | null
  headerVh: number
  sidebarVw: number
  footerVh: number
  isVertical: boolean
  viewportSize: 'small' | 'medium' | 'large' | 'extraLarge'
  isTouchDevice: boolean
  isLoaded: boolean
  showInfo: boolean
}

export const useDisplayStore = defineStore('display', {
  state: (): DisplayStoreState => ({
    headerState: 'open',
    sidebarLeft: 'hidden',
    sidebarRight: 'hidden',
    footer: 'open',
    focusedContainer: null,
    headerVh: 7,
    sidebarVw: 7,
    footerVh: 5,
    isVertical: false,
    viewportSize: 'large',
    isTouchDevice: false,
    isLoaded: false,
    showInfo: true, // Default is true; can be loaded from localStorage
  }),

  actions: {
    // Function to calculate sidebar width based on screen size and orientation
    calculateSidebarWidth(): number {
      if (this.isVertical) {
        return this.sidebarLeft === 'open' ? 25 : 4 // Custom width for vertical mode
      }
      
      switch (this.viewportSize) {
        case 'small':
          return this.sidebarLeft === 'open' ? 25 : this.sidebarLeft === 'compact' ? 12 : 4
        case 'medium':
          return this.sidebarLeft === 'open' ? 15 : this.sidebarLeft === 'compact' ? 10 : 4
        case 'large':
          return this.sidebarLeft === 'open' ? 18 : this.sidebarLeft === 'compact' ? 10 : 4
        case 'extraLarge':
        default:
          return this.sidebarLeft === 'open' ? 20 : this.sidebarLeft === 'compact' ? 12 : 4
      }
    },

    // Update the viewport size and orientation
    updateViewport() {
      if (typeof window !== 'undefined') {
        this.isVertical = window.innerHeight > window.innerWidth

        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

        const width = window.innerWidth

        if (width < 768) {
          this.viewportSize = 'small'
        } else if (width >= 768 && width < 1024) {
          this.viewportSize = 'medium'
        } else if (width >= 1024 && width < 1440) {
          this.viewportSize = 'large'
        } else {
          this.viewportSize = 'extraLarge'
        }

        this.headerVh = Math.min(10, 7)
        this.sidebarVw = this.calculateSidebarWidth()

      }
    },

    // Initialize the viewport watcher for dynamic resizing
    initializeViewportWatcher() {
      this.updateViewport()
      window.addEventListener('resize', this.updateViewport)
    },

    // Remove the viewport watcher
    removeViewportWatcher() {
      window.removeEventListener('resize', this.updateViewport)
    },
  },
})
