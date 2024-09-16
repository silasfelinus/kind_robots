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
    sidebarVw: 4, // Default collapsed sidebar width (4vw)
    footerVh: 5, // Default footer height in vh
    isVertical: false,
  }),

  actions: {
    // Load persisted state from localStorage
    loadState() {
      if (typeof window !== 'undefined') {
        const loadDisplayState = (key: keyof DisplayStoreState, defaultValue: DisplayState) => {
          this[key] = (localStorage.getItem(key) as DisplayState) || defaultValue
        }

        loadDisplayState('headerState', 'open')
        loadDisplayState('sidebarLeft', 'hidden')
        loadDisplayState('sidebarRight', 'hidden')
        loadDisplayState('footer', 'hidden')

        this.showIntro = localStorage.getItem('showIntro') !== 'false'
        this.headerVh = parseInt(localStorage.getItem('headerVh') || '7', 10)
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

        // Header height calculation: Max 10vh, otherwise 7% of viewport height
        this.headerVh = Math.min(10, 7)

        // Adjust sidebar width based on the current state ('open', 'compact', or 'hidden')
        this.sidebarVw = this.calculateSidebarWidth(this.sidebarLeft)

        localStorage.setItem('headerVh', this.headerVh.toString())
      }
    },

    // Calculate sidebar width based on state
    calculateSidebarWidth(sidebarState: DisplayState): number {
      if (this.isVertical) {
        return sidebarState === 'open' ? 100 : 4 // Full width in vertical mode
      }
      switch (sidebarState) {
        case 'open':
          return 30 // Open state: 30vw
        case 'compact':
          return 10 // Compact state: 10vw
        case 'hidden':
        default:
          return 4 // Hidden or default collapsed state: 4vw
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
