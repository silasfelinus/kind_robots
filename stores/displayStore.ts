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
  sidebarVw: number
  footerVh: number
  isVertical: boolean
  viewportSize: 'small' | 'medium' | 'large' | 'extraLarge'
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
    viewportSize: 'large',
    isTouchDevice: false,
    isLoaded: false,
    showInfo: true,
  }),

  actions: {
    // Function to calculate sidebar width based on screen size and orientation
    calculateSidebarWidth(): number {
      try {
        console.log('Calculating sidebar width based on viewport size:', this.viewportSize)
        switch (this.viewportSize) {
          case 'small':
            return this.sidebarLeft === 'open' ? 25 : this.sidebarLeft === 'compact' ? 12 : 4
          case 'medium':
            return this.sidebarLeft === 'open' ? 15 : this.sidebarLeft === 'compact' ? 10 : 4
          case 'large':
            return this.sidebarLeft === 'open' ? 18 : this.sidebarLeft === 'compact' ? 10 : 4
          case 'extraLarge':
          default:
            return this.sidebarLeft === 'open' ? 20 : this.sidebarLeft === 'compact' ? 12 : 4
        }
      } catch (error) {
        console.error('Error calculating sidebar width:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
        return 7 // Default width in case of error
      }
    },

    // Toggle sidebar state between 'hidden', 'compact', and 'open'
    toggleSidebar(side: 'sidebarLeft' | 'sidebarRight') {
      try {
        console.log(`Toggling sidebar ${side}. Current state:`, this[side])
        const stateCycle: Record<DisplayState, DisplayState> = {
          hidden: 'compact',
          compact: 'open',
          open: 'hidden',
          disabled: 'hidden',
        }
        this[side] = stateCycle[this[side]]
        this.sidebarVw = this.calculateSidebarWidth()

        // Save state to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(side, this[side])
        }
        console.log(`Sidebar ${side} updated to:`, this[side])
      } catch (error) {
        console.error(`Error toggling sidebar ${side}:`, error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    // Update the viewport size and orientation
    updateViewport() {
      try {
        if (typeof window !== 'undefined') {
          console.log('Updating viewport...')
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

          console.log('Viewport size determined as:', this.viewportSize)

          // Set the header height and sidebar width
          this.headerVh = Math.min(window.innerHeight * 0.1, 7)
          this.sidebarVw = this.calculateSidebarWidth()

          console.log('Viewport updated. Header height:', this.headerVh, 'Sidebar width:', this.sidebarVw)
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
        console.log('Initializing viewport watcher...')
        this.updateViewport()
        window.addEventListener('resize', this.updateViewport)
        console.log('Viewport watcher initialized.')
      } catch (error) {
        console.error('Error initializing viewport watcher:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    // Remove the viewport watcher
    removeViewportWatcher() {
      try {
        console.log('Removing viewport watcher...')
        window.removeEventListener('resize', this.updateViewport)
        console.log('Viewport watcher removed.')
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
            console.log('Loading display state from localStorage...')
            const storedSidebarLeft = localStorage.getItem('sidebarLeft') as DisplayState
            const storedSidebarRight = localStorage.getItem('sidebarRight') as DisplayState
            const storedHeaderVh = localStorage.getItem('headerVh')

            if (storedSidebarLeft) {
              this.sidebarLeft = storedSidebarLeft
              console.log('Loaded sidebarLeft from localStorage:', this.sidebarLeft)
            }

            if (storedSidebarRight) {
              this.sidebarRight = storedSidebarRight
              console.log('Loaded sidebarRight from localStorage:', this.sidebarRight)
            }

            if (storedHeaderVh) {
              this.headerVh = parseInt(storedHeaderVh, 10)
              console.log('Loaded headerVh from localStorage:', this.headerVh)
            }

            this.sidebarVw = this.calculateSidebarWidth()
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
          console.log('Saving display state to localStorage...')
          localStorage.setItem('sidebarLeft', this.sidebarLeft)
          localStorage.setItem('sidebarRight', this.sidebarRight)
          localStorage.setItem('headerVh', this.headerVh.toString())
          console.log('Display state saved successfully.')
        }
      } catch (error) {
        console.error('Error saving display state to localStorage:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    }
  },
})
