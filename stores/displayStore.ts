import { defineStore } from 'pinia'
import { useErrorStore, ErrorType } from './errorStore'

export type DisplayState = 'open' | 'compact' | 'hidden' | 'disabled'

interface DisplayStoreState {
  headerState: DisplayState
  sidebarLeft: DisplayState
  sidebarRight: DisplayState
  footer: DisplayState
  focusedContainer: 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer' | null
  headerVh: number
  footerVh: number
  sidebarLeftVw: number
  sidebarRightVw: number
  mainVh: number
  mainVw: number
  footerVw: number
  isVertical: boolean
  viewportSize: 'small' | 'medium' | 'large' | 'extraLarge'
  isTouchDevice: boolean
  isLoaded: boolean
  showInfo: boolean
  iconSize: number  // This will track the base icon size
}

export const useDisplayStore = defineStore('display', {
  state: (): DisplayStoreState => ({
    headerState: 'open',
    sidebarLeft: 'open',
    sidebarRight: 'hidden',
    footer: 'open',
    focusedContainer: null,
    headerVh: 7,
    footerVh: 5,
    sidebarLeftVw: 7,
    sidebarRightVw: 7,
    mainVh: 0,
    mainVw: 0,
    footerVw: 100,
    isVertical: false,
    viewportSize: 'large',
    isTouchDevice: false,
    isLoaded: false,
    showInfo: true,
    iconSize: 24,  // Default icon size, but we'll dynamically update it
  }),

  actions: {
    // Update the viewport size and adjust icon size accordingly
    updateViewport() {
      try {
        if (typeof window !== 'undefined') {
          this.isVertical = window.innerHeight > window.innerWidth
          this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

          const width = window.innerWidth

          // Determine viewport size
          if (width < 768) {
            this.viewportSize = 'small'
            this.iconSize = 20  // Smaller icon size for small devices
          } else if (width >= 768 && width < 1024) {
            this.viewportSize = 'medium'
            this.iconSize = 24  // Medium size icons for tablets or similar devices
          } else if (width >= 1024 && width < 1440) {
            this.viewportSize = 'large'
            this.iconSize = 28  // Larger size for desktops
          } else {
            this.viewportSize = 'extraLarge'
            this.iconSize = 32  // Very large icons for extra-large screens
          }

          // Set the header height and sidebar widths
          this.headerVh = Math.min(window.innerHeight * 0.1, 7)
          this.sidebarLeftVw = this.calculateSidebarLeftWidth()
          this.sidebarRightVw = this.calculateSidebarRightWidth()

          // Recalculate main content size based on the updated values
          this.calculateMainContentSize()
        }
      } catch (error) {
        console.error('Error updating viewport:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    // Other actions such as calculateSidebarLeftWidth, calculateSidebarRightWidth, etc.
    // These methods remain the same and continue as needed.
  
    // Function to calculate sidebar width for left sidebar based on screen size and orientation
    calculateSidebarLeftWidth(): number {
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
        console.error('Error calculating left sidebar width:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
        return 7 // Default width in case of error
      }
    },

    // Function to calculate sidebar width for right sidebar based on screen size and orientation
    calculateSidebarRightWidth(): number {
      try {
        switch (this.viewportSize) {
          case 'small':
            return this.sidebarRight === 'open' ? 13 : this.sidebarRight === 'compact' ? 12 : 2
          case 'medium':
            return this.sidebarRight === 'open' ? 13 : this.sidebarRight === 'compact' ? 10 : 2
          case 'large':
            return this.sidebarRight === 'open' ? 13 : this.sidebarRight === 'compact' ? 8 : 1
          case 'extraLarge':
          default:
            return this.sidebarRight === 'open' ? 13 : this.sidebarRight === 'compact' ? 6 : 1
        }
      } catch (error) {
        console.error('Error calculating right sidebar width:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
        return 7 // Default width in case of error
      }
    },
   toggleFooter() {
      try {
        const stateCycle: Record<DisplayState, DisplayState> = {
          hidden: 'open',
          compact: 'hidden',
          open: 'compact',
          disabled: 'hidden',
        }
        this.footer = stateCycle[this.footer]

        // Recalculate the main content size after footer toggle
        this.calculateMainContentSize()

        // Save the footer state to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('footer', this.footer)
        }
      } catch (error) {
        console.error('Error toggling footer:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    calculateMainContentSize() {
      try {
        const headerHeight = this.headerState !== 'hidden' ? this.headerVh : 0
        const footerHeight = this.footer !== 'hidden' ? this.footerVh : 0
        const leftSidebarWidth = this.sidebarLeft !== 'hidden' ? this.sidebarLeftVw : 0
        const rightSidebarWidth = this.sidebarRight !== 'hidden' ? this.sidebarRightVw : 0

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

    // Toggle sidebar state for either left or right sidebar
    toggleSidebar(side: 'sidebarLeft' | 'sidebarRight') {
      try {
        const stateCycle: Record<DisplayState, DisplayState> = {
          hidden: 'open',
          compact: 'hidden',
          open: 'compact',
          disabled: 'hidden',
        }
        this[side] = stateCycle[this[side]]

        // Recalculate the width of the toggled sidebar
        if (side === 'sidebarLeft') {
          this.sidebarLeftVw = this.calculateSidebarLeftWidth()
        } else {
          this.sidebarRightVw = this.calculateSidebarRightWidth()
        }

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

        // Recalculate the widths for left or right sidebar if applicable
        if (container === 'sidebarLeft') {
          this.sidebarLeftVw = this.calculateSidebarLeftWidth()
        } else if (container === 'sidebarRight') {
          this.sidebarRightVw = this.calculateSidebarRightWidth()
        }

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

            this.sidebarLeftVw = this.calculateSidebarLeftWidth()
            this.sidebarRightVw = this.calculateSidebarRightWidth()
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
