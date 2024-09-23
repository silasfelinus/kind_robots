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

    // Toggle sidebar state between 'hidden', 'compact', and 'open'
    toggleSidebar(side: 'sidebarLeft' | 'sidebarRight') {
      const stateCycle: Record<DisplayState, DisplayState> = {
        hidden: 'compact',
        compact: 'open',
        open: 'hidden',
        disabled: 'hidden', // Optional state that can be ignored for now
      }
      this[side] = stateCycle[this[side]]
      this.sidebarVw = this.calculateSidebarWidth()

      // Save state to localStorage if necessary
      if (typeof window !== 'undefined') {
        localStorage.setItem(side, this[side])
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

    // Load the saved display settings from localStorage
    loadState() {
      if (typeof window !== 'undefined') {
        const storedSidebarLeft = localStorage.getItem('sidebarLeft') as DisplayState
        const storedSidebarRight = localStorage.getItem('sidebarRight') as DisplayState
        const storedHeaderVh = localStorage.getItem('headerVh')

        if (storedSidebarLeft) {
          this.sidebarLeft = storedSidebarLeft
        }

        if (storedSidebarRight) {
          this.sidebarRight = storedSidebarRight
        }

        if (storedHeaderVh) {
          this.headerVh = parseInt(storedHeaderVh, 10)
        }

        this.sidebarVw = this.calculateSidebarWidth()
      }
    },

    // Save the display state to localStorage
    saveState() {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarLeft', this.sidebarLeft)
        localStorage.setItem('sidebarRight', this.sidebarRight)
        localStorage.setItem('headerVh', this.headerVh.toString())
      }
    }
  },
})
