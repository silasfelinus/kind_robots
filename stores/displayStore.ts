import { defineStore } from 'pinia'
import { useErrorStore, ErrorType } from './errorStore'

export type DisplayState = 'open' | 'compact' | 'hidden' | 'disabled'

// Define the interface for the store's state
interface DisplayStoreState {
  headerState: DisplayState
  sidebarLeft: DisplayState
  sidebarRight: DisplayState
  footer: DisplayState
  focusedContainer: 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer' | null
  headerVh: number
  footerVh: number
  sidebarVw: number
  mainVh: number
  mainVw: number
  footerVw: number
  isVertical: boolean
  viewportSize: 'small' | 'medium' | 'large' | 'extraLarge'
  isTouchDevice: boolean
  isLoaded: boolean
  showInfo: boolean
}

export const useDisplayStore = defineStore('display', {
  state: (): DisplayStoreState => ({
    headerState: 'open',
    sidebarLeft: 'open',
    sidebarRight: 'hidden',
    footer: 'open',
    focusedContainer: null,
    headerVh: 7,
    sidebarVw: 7,
    footerVh: 5,
    mainVh: 0,
    mainVw: 0,
    footerVw: 100,
    isVertical: false,
    viewportSize: 'large',
    isTouchDevice: false,
    isLoaded: false,
    showInfo: true,
  }),

  actions: {
    // Function to calculate sidebar width based on screen size and orientation
    calculateSidebarWidth(): number {
      try {
        switch (this.viewportSize) {
          case 'small':
            return this.sidebarLeft === 'open' ? 13 : this.sidebarLeft === 'compact' ? 12 : 2
          case 'medium':
            return this.sidebarLeft === 'open' ? 13 : this.sidebarLeft === 'compact' ? 10 : 2
          case 'large':
            return this.sidebarLeft === 'open' ? 13 : this.sidebarLeft === 'compact' ? 8 : 1
          case 'extraLarge':
          default:
            return this.sidebarLeft === 'open' ? 13 : this.sidebarLeft === 'compact' ? 6 : 1
        }
      } catch (error) {
        console.error('Error calculating sidebar width:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
        return 7 // Default width in case of error
      }
    },

    // Function to calculate the available space for the main content area
    calculateMainContentSize() {
      try {
        const headerHeight = this.headerState !== 'hidden' ? this.headerVh : 0
        const footerHeight = this.footer !== 'hidden' ? this.footerVh : 0
        const leftSidebarWidth = this.sidebarLeft !== 'hidden' ? this.sidebarVw : 0
        const rightSidebarWidth = this.sidebarRight !== 'hidden' ? this.sidebarVw : 0

        // Calculate available vertical and horizontal space for the main content
        this.mainVh = 100 - headerHeight - footerHeight
        this.mainVw = 100 - leftSidebarWidth - rightSidebarWidth

        // Footer width might be affected by the sidebars
        this.footerVw = 100 - leftSidebarWidth - rightSidebarWidth
      } catch (error) {
        console.error('Error calculating main content size:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    // Toggle sidebar state between 'hidden', 'compact', and 'open'
    toggleSidebar(side: 'sidebarLeft' | 'sidebarRight') {
      try {
        const stateCycle: Record<DisplayState, DisplayState> = {
          hidden: 'open',
          compact: 'hidden',
          open: 'compact',
          disabled: 'hidden',
        }
        this[side] = stateCycle[this[side]]
        this.sidebarVw = this.calculateSidebarWidth()

        // Recalculate main content size after toggling sidebars
        this.calculateMainContentSize()

        // Save state to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(side, this[side])
        }
      } catch (error) {
        console.error(`Error toggling sidebar ${side}:`, error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    // Change the state of a container and update layout accordingly
    changeState(container: 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer', state: DisplayState) {
      try {
        this[container] = state
        this.sidebarVw = this.calculateSidebarWidth()

        // Recalculate main content size after changing the state of a container
        this.calculateMainContentSize()

        // Save the new state to localStorage if needed
        if (typeof window !== 'undefined') {
          localStorage.setItem(container, this[container])
        }
      } catch (error) {
        console.error(`Error changing state for ${container}:`, error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    // Update the viewport size and orientation
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

          // Set the header height and sidebar width
          this.headerVh = Math.min(window.innerHeight * 0.1, 7)
          this.sidebarVw = this.calculateSidebarWidth()

          // Recalculate main content size based on the updated values
          this.calculateMainContentSize()
        }
      } catch (error) {
        console.error('Error updating viewport:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    // Initialize the viewport watcher for dynamic resizing
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

    // Remove the viewport watcher
    removeViewportWatcher() {
      try {
        window.removeEventListener('resize', this.updateViewport)
      } catch (error) {
        console.error('Error removing viewport watcher:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    // Load the saved display settings from localStorage
    loadState(): Promise<void> {
      return new Promise((resolve, reject) => {
        try {
          if (typeof window !== 'undefined') {
            const storedSidebarLeft = localStorage.getItem('sidebarLeft') as DisplayState
            const storedSidebarRight = localStorage.getItem('sidebarRight') as DisplayState
            const storedHeaderVh = localStorage.getItem('headerVh')
            const storedFooterVh = localStorage.getItem('footerVh')
            const storedMainVh = localStorage.getItem('mainVh')
            const storedMainVw = localStorage.getItem('mainVw')
            const storedFooterVw = localStorage.getItem('footerVw')

            if (storedSidebarLeft) {
              this.sidebarLeft = storedSidebarLeft
            }

            if (storedSidebarRight) {
              this.sidebarRight = storedSidebarRight
            }

            if (storedHeaderVh) {
              this.headerVh = parseInt(storedHeaderVh, 10)
            }

            if (storedFooterVh) {
              this.footerVh = parseInt(storedFooterVh, 10)
            }

            if (storedMainVh) {
              this.mainVh = parseInt(storedMainVh, 10)
            }

            if (storedMainVw) {
              this.mainVw = parseInt(storedMainVw, 10)
            }

            if (storedFooterVw) {
              this.footerVw = parseInt(storedFooterVw, 10)
            }

            this.sidebarVw = this.calculateSidebarWidth()
            this.calculateMainContentSize()
          }
          resolve()
        } catch (error) {
          console.error('Error loading display state from localStorage:', error)
          const errorStore = useErrorStore()
          errorStore.setError(ErrorType.GENERAL_ERROR, error)
          reject(error)
        }
      })
    },

    // Save the display state to localStorage
    saveState() {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('sidebarLeft', this.sidebarLeft)
          localStorage.setItem('sidebarRight', this.sidebarRight)
          localStorage.setItem('headerVh', this.headerVh.toString())
          localStorage.setItem('footerVh', this.footerVh.toString())
          localStorage.setItem('mainVh', this.mainVh.toString())
          localStorage.setItem('mainVw', this.mainVw.toString())
          localStorage.setItem('footerVw', this.footerVw.toString())
        }
      } catch (error) {
        console.error('Error saving display state to localStorage:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    }
  },
})
