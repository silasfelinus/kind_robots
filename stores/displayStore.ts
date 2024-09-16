import { defineStore } from 'pinia'

// Define the type for possible display states
type DisplayState = 'open' | 'compact' | 'hidden' | 'disabled'

// Define the interface for the store's state
interface DisplayStoreState {
  headerState: DisplayState
  sidebarLeft: DisplayState
  sidebarRight: DisplayState
  footer: DisplayState
  focusedContainer: 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer' | null
  showIntro: boolean
  headerVh: number
  sidebarVw: number
  footerVh: number
  isVertical: boolean
  viewportSize: 'mobile' | 'tablet' | 'desktop' | 'largeScreen' // Added 'largeScreen'
  isTouchDevice: boolean // Detects if the device is touch-enabled
}

// Define the store
export const useDisplayStore = defineStore('display', {
  state: (): DisplayStoreState => ({
    headerState: 'open',
    sidebarLeft: 'hidden',
    sidebarRight: 'hidden',
    footer: 'hidden',
    focusedContainer: null,
    showIntro: true,
    headerVh: 7, // Default header height in vh
    sidebarVw: 7, // Default compact sidebar width (4vw)
    footerVh: 5, // Default footer height in vh
    isVertical: false,
    viewportSize: 'desktop', // Default to desktop size
    isTouchDevice: false // Default to non-touch devices
  }),

  actions: {
    // Load persisted state from localStorage
    loadState() {
      if (typeof window !== 'undefined') {
        const loadDisplayState = (key: keyof DisplayStoreState, defaultValue: DisplayState) => {
          const storedValue = localStorage.getItem(key);
          if (storedValue) {
            (this[key] as DisplayState) = storedValue as DisplayState;
          } else {
            (this[key] as DisplayState) = defaultValue;
          }
        }
    
        loadDisplayState('headerState', 'open');
        loadDisplayState('sidebarLeft', 'hidden');
        loadDisplayState('sidebarRight', 'hidden');
        loadDisplayState('footer', 'hidden');
    
        this.showIntro = localStorage.getItem('showIntro') !== 'false';
        this.headerVh = parseInt(localStorage.getItem('headerVh') || '7', 10);
      }
    },

    // Toggle intro visibility
    toggleIntroState() {
      this.showIntro = !this.showIntro
      localStorage.setItem('showIntro', JSON.stringify(this.showIntro))
    },

    // Update viewport dimensions and header/sidebar sizes dynamically
    updateViewport() {
      if (typeof window !== 'undefined') {
        this.isVertical = window.innerHeight > window.innerWidth
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

        // Determine viewport size based on width (breakpoints for mobile, tablet, desktop, large screens)
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
        this.sidebarVw = this.calculateSidebarWidth(this.sidebarLeft)

        localStorage.setItem('headerVh', this.headerVh.toString())
      }
    },

    // Calculate sidebar width based on state, screen size, and touch capability
    calculateSidebarWidth(sidebarState: DisplayState): number {
      const isVertical = this.isVertical
      const size = this.viewportSize
      const isTouch = this.isTouchDevice

      if (isVertical) {
        return sidebarState === 'open' ? 30 : 4 // Full width in vertical mode
      }

      // Sidebar size varies based on screen size, touch capability, and state
      switch (size) {
        case 'mobile':
          return sidebarState === 'open' ? 25 : sidebarState === 'compact' ? 12 : 4 // Mobile
        case 'tablet':
          return sidebarState === 'open' ? 20 : sidebarState === 'compact' ? 14 : 4 // Tablet
        case 'desktop':
          return sidebarState === 'open' ? (isTouch ? 22 : 20) : sidebarState === 'compact' ? 8 : 4 // Desktop, larger touch devices get wider sidebars
        case 'largeScreen':
        default:
          return sidebarState === 'open' ? (isTouch ? 22 : 20) : sidebarState === 'compact' ? 10 : 4 // Large screens
      }
    },

    // Toggle sidebar visibility between 'open', 'compact', and 'hidden'
    toggleSidebar(container: 'sidebarLeft' | 'sidebarRight') {
      const currentState = this[container]

      if (currentState === 'hidden') {
        this[container] = 'compact'
      } else if (currentState === 'compact') {
        this[container] = 'open'
      } else {
        this[container] = 'hidden'
      }

      this.sidebarVw = this.calculateSidebarWidth(this[container])

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
    changeState(container: 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer', newState: DisplayState) {
      this[container] = newState
      this.sidebarVw = this.calculateSidebarWidth(this.sidebarLeft)

      if (typeof window !== 'undefined') {
        localStorage.setItem(container, newState)
      }
    },
  },
})
