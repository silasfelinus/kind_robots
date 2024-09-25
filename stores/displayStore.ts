import { defineStore } from 'pinia'
import { useErrorStore, ErrorType } from './errorStore'

export type DisplayState = 'open' | 'compact' | 'hidden' | 'disabled'

interface DisplayStoreState {
  headerState: DisplayState
  sidebarLeftState: DisplayState
  sidebarRightState: DisplayState
  footerState: DisplayState
  isVertical: boolean
  viewportSize: 'small' | 'medium' | 'large' | 'extraLarge'
  isTouchDevice: boolean
  showInfo: boolean
}

export const useDisplayStore = defineStore('display', {
  state: (): DisplayStoreState => ({
    headerState: 'open',
    sidebarLeftState: 'open',
    sidebarRightState: 'hidden',
    footerState: 'hidden',
    isVertical: false,
    viewportSize: 'large',
    isTouchDevice: false,
    showInfo: true,
  }),

  getters: {
    // Dynamically calculate header height based on viewport size and state
    headerVh: (state) => {
      const sizes = {
        small: { open: 8, compact: 6, hidden: 0 },
        medium: { open: 7, compact: 5, hidden: 0 },
        large: { open: 6, compact: 4, hidden: 0 },
        extraLarge: { open: 5, compact: 3, hidden: 0 }
      }[state.viewportSize]

      return sizes[state.headerState] || 6
    },

    // Dynamically calculate left sidebar width based on viewport size and state
    sidebarLeftVw: (state) => {
      const sizes = {
        small: { open: 21, compact: 12, hidden: 0 },
        medium: { open: 19, compact: 10, hidden: 0 },
        large: { open: 16, compact: 8, hidden: 0 },
        extraLarge: { open: 13, compact: 6, hidden: 0 }
      }[state.viewportSize]

      return sizes[state.sidebarLeftState] || 16
    },

    // Dynamically calculate right sidebar width based on viewport size and state
    sidebarRightVw: (state) => {
      const sizes = {
        small: { open: 3, compact: 2, hidden: 0 },
        medium: { open: 2, compact: 1, hidden: 0 },
        large: { open: 2, compact: 1, hidden: 0 },
        extraLarge: { open: 2, compact: 1, hidden: 0 }
      }[state.viewportSize]

      return sizes[state.sidebarRightState] || 2
    },

    // Dynamically calculate footer height based on viewport size and state
    footerVh: (state) => {
      const sizes = {
        small: { open: 3, compact: 2, hidden: 0 },
        medium: { open: 2, compact: 1, hidden: 0 },
        large: { open: 2, compact: 1, hidden: 0 },
        extraLarge: { open: 1, compact: 0.5, hidden: 0 }
      }[state.viewportSize]

      return sizes[state.footerState] || 2
    },

    // Calculate main content height based on viewport size and component sizes
    mainVh: (state) => {
      return 100 - state.headerVh - state.footerVh
    },

    // Calculate main content width based on viewport size and sidebar widths
    mainVw: (state) => {
      return 100 - state.sidebarLeftVw - state.sidebarRightVw
    },

    // Return icon size based on viewport size
    iconSize: (state) => {
      const sizes = {
        small: { open: 18, compact: 16, hidden: 14 },
        medium: { open: 24, compact: 20, hidden: 18 },
        large: { open: 28, compact: 24, hidden: 20 },
        extraLarge: { open: 32, compact: 28, hidden: 24 }
      }[state.viewportSize]

      return sizes[state.headerState] || 24
    }
  },

  actions: {
    // Update the viewport size and handle screen size adjustments
    updateViewport() {
      try {
        if (typeof window !== 'undefined') {
          this.isVertical = window.innerHeight > window.innerWidth
          this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

          const width = window.innerWidth
          // Determine viewport size
          if (width < 768) {
            this.viewportSize = 'small'
          } else if (width >= 768 && width < 1024) {
            this.viewportSize = 'medium'
          } else if (width >= 1024 && width < 1440) {
            this.viewportSize = 'large'
          } else {
            this.viewportSize = 'extraLarge'
          }
        }
      } catch (error) {
        console.error('Error updating viewport:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    // Toggle sidebar state and automatically recalculate layout
    toggleSidebar(side: 'sidebarLeftState' | 'sidebarRightState') {
      try {
        const stateCycle: Record<DisplayState, DisplayState> = {
          hidden: 'open',
          compact: 'hidden',
          open: 'compact',
          disabled: 'hidden',
        }
        this[side] = stateCycle[this[side]]

        // Save state to localStorage
        this.saveState()
      } catch (error) {
        console.error(`Error toggling sidebar ${side}:`, error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    // Toggle footer state
    toggleFooter() {
      try {
        const stateCycle: Record<DisplayState, DisplayState> = {
          hidden: 'open',
          open: 'hidden',
          compact: 'hidden',
          disabled: 'hidden',
        }
        this.footerState = stateCycle[this.footerState]

        // Save state to localStorage
        this.saveState()
      } catch (error) {
        console.error('Error toggling footer:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    // Initialize viewport watcher for dynamic resizing
    initializeViewportWatcher() {
      try {
        this.updateViewport()
        window.addEventListener('resize', this.updateViewport)
      } catch (error) {
        console.error('Error initializing viewport watcher:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    // Remove the viewport watcher when component is destroyed
    removeViewportWatcher() {
      try {
        window.removeEventListener('resize', this.updateViewport)
      } catch (error) {
        console.error('Error removing viewport watcher:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    // Load display state from localStorage
    loadState() {
      try {
        if (typeof window !== 'undefined') {
          const storedSidebarLeft = localStorage.getItem('sidebarLeftState') as DisplayState
          const storedSidebarRight = localStorage.getItem('sidebarRightState') as DisplayState
          const storedHeaderState = localStorage.getItem('headerState')
          const storedFooterState = localStorage.getItem('footerState')

          if (storedSidebarLeft) this.sidebarLeftState = storedSidebarLeft
          if (storedSidebarRight) this.sidebarRightState = storedSidebarRight
          if (storedHeaderState) this.headerState = storedHeaderState as DisplayState
          if (storedFooterState) this.footerState = storedFooterState as DisplayState
        }
      } catch (error) {
        console.error('Error loading display state from localStorage:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    // Save display state to localStorage
    saveState() {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('sidebarLeftState', this.sidebarLeftState)
          localStorage.setItem('sidebarRightState', this.sidebarRightState)
          localStorage.setItem('headerState', this.headerState)
          localStorage.setItem('footerState', this.footerState)
        }
      } catch (error) {
        console.error('Error saving display state to localStorage:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },
  },
})
