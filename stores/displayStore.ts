import { defineStore } from 'pinia'

// Define the type for possible display states
export type DisplayState = 'open' | 'compact' | 'hidden' | 'disabled'

// Define the interface for the store's state
interface DisplayStoreState {
  headerState: DisplayState
  sidebarLeft: DisplayState
  sidebarRight: DisplayState
  footer: DisplayState
  focusedContainer:
    | 'headerState'
    | 'sidebarLeft'
    | 'sidebarRight'
    | 'footer'
    | null
  headerVh: number
  sidebarVw: number
  footerVh: number
  isVertical: boolean
  viewportSize: 'mobile' | 'tablet' | 'desktop' | 'largeScreen'
  isTouchDevice: boolean
  isLoaded: boolean
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
  }),

  actions: {
    // Function to load a single display state from localStorage
    loadDisplayState(key: keyof DisplayStoreState, defaultValue: DisplayState): DisplayState {
      const storedValue = localStorage.getItem(key as string)
      if (storedValue && ['open', 'compact', 'hidden', 'disabled'].includes(storedValue)) {
        return storedValue as DisplayState
      }
      return defaultValue
    },

    // Load persisted state from localStorage
    loadState() {
      if (typeof window !== 'undefined') {
        this.headerState = this.loadDisplayState('headerState', 'open')
        this.sidebarLeft = this.loadDisplayState('sidebarLeft', 'hidden')
        this.sidebarRight = this.loadDisplayState('sidebarRight', 'hidden')
        this.footer = this.loadDisplayState('footer', 'open')

        const storedHeaderVh = localStorage.getItem('headerVh')
        this.headerVh = storedHeaderVh ? parseInt(storedHeaderVh, 10) : 7

        this.sidebarVw = this.calculateSidebarWidth()

        this.isLoaded = true
      }
    },

    // Save current state to localStorage
    saveState() {
      if (typeof window !== 'undefined') {
        localStorage.setItem('headerState', this.headerState)
        localStorage.setItem('sidebarLeft', this.sidebarLeft)
        localStorage.setItem('sidebarRight', this.sidebarRight)
        localStorage.setItem('footer', this.footer)
        localStorage.setItem('headerVh', this.headerVh.toString())
      }
    },

    // Calculate sidebar width based on state, screen size, and touch capability
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
    

    // Update viewport dimensions and header/sidebar sizes dynamically
    updateViewport() {
      if (typeof window !== 'undefined') {
        this.isVertical = window.innerHeight > window.innerWidth
        this.isTouchDevice =
          'ontouchstart' in window || navigator.maxTouchPoints > 0

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

        // Header height calculation: Max 10vh, otherwise 7% of viewport height
        this.headerVh = Math.min(10, 7)

        // Adjust sidebar width based on the current state and screen size
        this.sidebarVw = this.calculateSidebarWidth()

        localStorage.setItem('headerVh', this.headerVh.toString())
      }
    },

    // Toggle sidebar visibility between 'open', 'compact', and 'hidden'
    toggleSidebar(container: 'sidebarLeft' | 'sidebarRight') {
      const stateCycle: Record<DisplayState, DisplayState> = {
        hidden: 'compact',
        compact: 'open',
        open: 'hidden',
        disabled: 'hidden', // Optional, depending on your use case
      }
    
      this[container] = stateCycle[this[container]]
      this.sidebarVw = this.calculateSidebarWidth()
    
      if (typeof window !== 'undefined') {
        localStorage.setItem(container, this[container])
      }
    },

    // Handle orientation change and update layout
    checkOrientation() {
      this.isVertical = window.innerHeight > window.innerWidth
      this.updateViewport()
    },

    // Initialize viewport watcher for dynamic resizing
    initializeViewportWatcher() {
      this.updateViewport()
      window.addEventListener('resize', this.checkOrientation)
    },

    // Remove viewport listener when unmounting
    removeViewportWatcher() {
      window.removeEventListener('resize', this.checkOrientation)
    },

    // Change state for header, sidebar, and footer, and persist the state
    changeState(
      container: 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer',
      newState: DisplayState,
    ) {
      this[container] = newState
      this.sidebarVw = this.calculateSidebarWidth()

      if (typeof window !== 'undefined') {
        localStorage.setItem(container, newState)
      }
    },
  },
})
