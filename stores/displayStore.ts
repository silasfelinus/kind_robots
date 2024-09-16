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

        // Sidebar width: 16vw in horizontal, full width (100vw) in vertical mode
        this.sidebarVw = this.sidebarLeft === 'open' ? (this.isVertical ? 100 : 16) : 4

        localStorage.setItem('headerVh', this.headerVh.toString())
      }
    },

    // Toggle sidebar visibility and adjust width
    toggleSidebar(container: 'sidebarLeft' | 'sidebarRight') {
      this[container] = this[container] === 'hidden' ? 'open' : 'hidden'
      this.sidebarVw = this.sidebarLeft === 'open' ? (this.isVertical ? 100 : 16) : 4

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

      if (typeof window !== 'undefined') {
        localStorage.setItem(container, newState)
      }
    },
  },
})
