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
  headerFocused: boolean
  sidebarLeftFocused: boolean
  sidebarRightFocused: boolean
  footerFocused: boolean
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
    headerFocused: false,
    sidebarLeftFocused: false,
    sidebarRightFocused: false,
    footerFocused: false,
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
        this.headerState = (localStorage.getItem('headerState') as DisplayState) || 'open'
        this.sidebarLeft = (localStorage.getItem('sidebarLeft') as DisplayState) || 'hidden'
        this.sidebarRight = (localStorage.getItem('sidebarRight') as DisplayState) || 'hidden'
        this.footer = (localStorage.getItem('footer') as DisplayState) || 'hidden'
        this.showIntro = localStorage.getItem('showIntro') === 'false' ? false : true
        
        // Load header height from localStorage if available
        const storedHeaderVh = localStorage.getItem('headerVh')
        this.headerVh = storedHeaderVh ? parseInt(storedHeaderVh, 10) : 7
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

        // Dynamically calculate header height (for example, 7% of viewport height or max 10vh)
        this.headerVh = Math.min(10, (window.innerHeight * 0.07) / window.innerHeight * 100) // Header 7vh or capped at 10vh

        // Adjust sidebar width based on orientation
        if (this.sidebarLeft === 'open') {
          this.sidebarVw = this.isVertical ? 100 : 16 // Full width in vertical mode, 16vw in horizontal
        } else {
          this.sidebarVw = 4 // Collapsed state
        }

        // Save header height in localStorage for persistence
        localStorage.setItem('headerVh', this.headerVh.toString())
      }
    },

    // Toggle sidebar visibility and adjust width
    toggleSidebar(container: 'sidebarLeft' | 'sidebarRight') {
      const currentState = this[container]

      if (currentState === 'hidden') {
        this[container] = 'open'
        this.sidebarVw = this.isVertical ? 100 : 16 // Expand sidebar to 16vw or full width in vertical
      } else {
        this[container] = 'hidden'
        this.sidebarVw = 4 // Collapse sidebar to 4vw
      }

      // Save sidebar state in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(container, this[container])
      }
    },

    // Handle orientation change
    checkOrientation() {
      this.isVertical = window.innerHeight > window.innerWidth
      this.updateViewport() // Adjust layout based on orientation
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
    changeState(container: Extract<keyof DisplayStoreState, 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer'>, newState: DisplayState) {
      this[container] = newState

      // Save the new state in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(container, newState)
      }
    },
  },
})
