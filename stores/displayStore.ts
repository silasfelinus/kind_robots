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
  viewportSize: 'mobile' | 'tablet' | 'desktop' | 'largeScreen'
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
    viewportSize: 'desktop',
    isTouchDevice: false,
    isLoaded: false,
    showInfo: true, // Default is true; can be loaded from localStorage
  }),

  actions: {
    // Load state from localStorage and assign defaults if unavailable
    loadState() {
      if (typeof window !== 'undefined') {
        this.headerState = this.loadDisplayState('headerState', 'open')
        this.sidebarLeft = this.loadDisplayState('sidebarLeft', 'hidden')
        this.sidebarRight = this.loadDisplayState('sidebarRight', 'hidden')
        this.footer = this.loadDisplayState('footer', 'open')

        const storedHeaderVh = localStorage.getItem('headerVh')
        this.headerVh = storedHeaderVh ? parseInt(storedHeaderVh, 10) : 7

        const storedShowInfo = localStorage.getItem('showInfo')
        this.showInfo = storedShowInfo !== null ? storedShowInfo === 'true' : true

        this.sidebarVw = this.calculateSidebarWidth()
        this.isLoaded = true
      }
    },

    // Function to load a specific display state from localStorage
    loadDisplayState(key: keyof DisplayStoreState, defaultValue: DisplayState): DisplayState {
      const storedValue = localStorage.getItem(key as string)
      if (storedValue && ['open', 'compact', 'hidden', 'disabled'].includes(storedValue)) {
        return storedValue as DisplayState
      }
      return defaultValue
    },

    // Save the current state to localStorage
    saveState() {
      if (typeof window !== 'undefined') {
        localStorage.setItem('headerState', this.headerState)
        localStorage.setItem('sidebarLeft', this.sidebarLeft)
        localStorage.setItem('sidebarRight', this.sidebarRight)
        localStorage.setItem('footer', this.footer)
        localStorage.setItem('headerVh', this.headerVh.toString())
        localStorage.setItem('showInfo', this.showInfo.toString()) // Save showInfo state
      }
    },

    // Calculate sidebar width based on device type and screen size
    calculateSidebarWidth(): number {
      if (this.isVertical) {
        return this.sidebarLeft === 'open' ? 30 : 4
      }
      switch (this.viewportSize) {
        case 'mobile':
          return this.sidebarLeft === 'open' ? 25 : this.sidebarLeft === 'compact' ? 12 : 4
        case 'tablet':
          return this.sidebarLeft === 'open' ? 15 : this.sidebarLeft === 'compact' ? 14 : 6
        case 'desktop':
          return this.sidebarLeft === 'open' ? (this.isTouchDevice ? 22 : 20) : this.sidebarLeft === 'compact' ? 8 : 4
        case 'largeScreen':
        default:
          return this.sidebarLeft === 'open' ? (this.isTouchDevice ? 22 : 20) : this.sidebarLeft === 'compact' ? 10 : 4
      }
    },

    // Update the viewport size and orientation
    updateViewport() {
      if (typeof window !== 'undefined') {
        this.isVertical = window.innerHeight > window.innerWidth
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

        const width = window.innerWidth
        if (width < 600) {
          this.viewportSize = 'mobile'
        } else if (width >= 600 && width < 1024) {
          this.viewportSize = 'tablet'
        } else if (width >= 1024 && width < 1600) {
          this.viewportSize = 'desktop'
        } else {
          this.viewportSize = 'largeScreen'
        }

        this.headerVh = Math.min(10, 7)
        this.sidebarVw = this.calculateSidebarWidth()

        localStorage.setItem('headerVh', this.headerVh.toString())
      }
    },

    // Toggle sidebar state between 'hidden', 'compact', and 'open'
    toggleSidebar(container: 'sidebarLeft' | 'sidebarRight') {
      const stateCycle: Record<DisplayState, DisplayState> = {
        hidden: 'compact',
        compact: 'open',
        open: 'hidden',
        disabled: 'hidden', // Optional
      }
      this[container] = stateCycle[this[container]]
      this.sidebarVw = this.calculateSidebarWidth()
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(container, this[container])
      }
    },

    // Handle orientation changes and update layout
    checkOrientation() {
      this.isVertical = window.innerHeight > window.innerWidth
      this.updateViewport()
    },

    // Initialize the viewport watcher for dynamic resizing
    initializeViewportWatcher() {
      this.updateViewport()
      window.addEventListener('resize', this.checkOrientation)
    },

    // Remove the viewport watcher
    removeViewportWatcher() {
      window.removeEventListener('resize', this.checkOrientation)
    },

    // Update the state for header, sidebar, or footer and save to localStorage
    changeState(container: 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer', newState: DisplayState) {
      this[container] = newState
      this.sidebarVw = this.calculateSidebarWidth()

      if (typeof window !== 'undefined') {
        localStorage.setItem(container, newState)
      }
    },
  },
})
