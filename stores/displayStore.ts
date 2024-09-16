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
    headerVh: 7,
    sidebarVw: 4, // Default collapsed width (4vw)
    footerVh: 5,
    isVertical: false,
  }),

  actions: {
    loadState() {
      if (typeof window !== 'undefined') {
        this.headerState = (localStorage.getItem('headerState') as DisplayState) || 'open'
        this.sidebarLeft = (localStorage.getItem('sidebarLeft') as DisplayState) || 'hidden'
        this.sidebarRight = (localStorage.getItem('sidebarRight') as DisplayState) || 'hidden'
        this.footer = (localStorage.getItem('footer') as DisplayState) || 'hidden'
        this.showIntro = localStorage.getItem('showIntro') === 'false' ? false : true
      }
    },

    toggleIntroState() {
      this.showIntro = !this.showIntro
      localStorage.setItem('showIntro', JSON.stringify(this.showIntro))
    },

    // Update the viewport dimensions
    updateViewport() {
      if (typeof window !== 'undefined') {
        this.headerVh = window.innerHeight * 0.07 // 7% height of the viewport
        this.isVertical = window.innerHeight > window.innerWidth

        if (this.sidebarLeft === 'open') {
          this.sidebarVw = this.isVertical ? 100 : 16 // Full width in vertical mode, 16vw in horizontal
        } else {
          this.sidebarVw = 4 // Collapsed state
        }
      }
    },

    // Toggle sidebar open/close and adjust width
    toggleSidebar(container: 'sidebarLeft' | 'sidebarRight') {
      const currentState = this[container]

      if (currentState === 'hidden') {
        this[container] = 'open'
        this.sidebarVw = this.isVertical ? 100 : 16 // Expand sidebar to 16vw or full width in vertical
      } else {
        this[container] = 'hidden'
        this.sidebarVw = 4 // Collapse sidebar to 4vw
      }

      // Save state in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(container, this[container])
      }
    },

    // Handle orientation change
    checkOrientation() {
      this.isVertical = window.innerHeight > window.innerWidth
      this.updateViewport() // Adjust layout based on orientation
    },

    // Add viewport listener and handle cleanup
    initializeViewportWatcher() {
      this.updateViewport()
      window.addEventListener('resize', this.checkOrientation)
    },

    removeViewportWatcher() {
      window.removeEventListener('resize', this.checkOrientation)
    },

    // Set state for header, sidebar, and footer
    changeState(container: Extract<keyof DisplayStoreState, 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer'>, newState: DisplayState) {
      this[container] = newState

      // Save new state in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(container, newState)
      }
    },
  },
})
