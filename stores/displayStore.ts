import { defineStore } from 'pinia'
import { useErrorStore, ErrorType } from './../stores/errorStore'

export type DisplayState = 'open' | 'compact' | 'hidden' | 'disabled'

interface DisplayStoreState {
  headerState: DisplayState
  sidebarLeftState: DisplayState
  sidebarRightState: DisplayState
  footerState: DisplayState
  isVertical: boolean
  viewportSize: 'small' | 'medium' | 'large' | 'extraLarge'
  isTouchDevice: boolean
  showTutorial: boolean
  isInitialized: boolean
  showIntro: boolean
  footerVw: number
}

export const useDisplayStore = defineStore('display', {
  state: (): DisplayStoreState => {
    console.log("Initializing display store state")
    return {
      headerState: 'open',
      sidebarLeftState: 'open',
      sidebarRightState: 'hidden',
      footerState: 'hidden',
      isVertical: false,
      viewportSize: 'large',
      isTouchDevice: false,
      showTutorial: true,
      isInitialized: false,
      showIntro: true,
      footerVw: 100,
    }
  },

  getters: {
    headerVh: (state): number => {
      console.log("Calculating headerVh:", state)
      const sizes = {
        small: { open: 11, compact: 6, hidden: 1, disabled: 0 },
        medium: { open: 10, compact: 5, hidden: 1, disabled: 0 },
        large: { open: 9, compact: 4, hidden: 1, disabled: 0 },
        extraLarge: { open: 8, compact: 3, hidden: 1, disabled: 0 },
      }[state.viewportSize]
      return sizes[state.headerState] || 6
    },
    sidebarLeftVw: (state): number => {
      console.log("Calculating sidebarLeftVw:", state)
      const sizes = {
        small: { open: 24, compact: 12, hidden: 1, disabled: 0 },
        medium: { open: 21, compact: 10, hidden: 1, disabled: 0 },
        large: { open: 16, compact: 8, hidden: 1, disabled: 0 },
        extraLarge: { open: 13, compact: 6, hidden: 1, disabled: 0 },
      }[state.viewportSize]
      return sizes[state.sidebarLeftState] || 16
    },
    sidebarRightVw: (state): number => {
      console.log("Calculating sidebarRightVw:", state)
      const sizes = {
        small: { open: 3, compact: 2, hidden: 1, disabled: 0 },
        medium: { open: 3, compact: 2, hidden: 1, disabled: 0 },
        large: { open: 3, compact: 2, hidden: 1, disabled: 0 },
        extraLarge: { open: 3, compact: 2, hidden: 1, disabled: 0 },
      }[state.viewportSize]
      return sizes[state.sidebarRightState] || 2
    },
    footerVh: (state): number => {
      console.log("Calculating footerVh:", state)
      const sizes = {
        small: { open: 3, compact: 2, hidden: 1, disabled: 0 },
        medium: { open: 2, compact: 1, hidden: 1, disabled: 0 },
        large: { open: 2, compact: 1, hidden: 1, disabled: 0 },
        extraLarge: { open: 1, compact: 0.5, hidden: 1, disabled: 0 },
      }[state.viewportSize]
      return sizes[state.footerState] || 2
    },
    mainVh(_state): number {
      console.log("Calculating mainVh")
      return 100 - this.headerVh - this.footerVh
    },
    mainVw(_state): number {
      console.log("Calculating mainVw")
      return 100 - this.sidebarLeftVw - this.sidebarRightVw
    },
    iconSize: (state): number => {
      console.log("Calculating iconSize:", state)
      const sizes = {
        small: { open: 18, compact: 16, hidden: 14, disabled: 14 },
        medium: { open: 24, compact: 20, hidden: 18, disabled: 18 },
        large: { open: 28, compact: 24, hidden: 20, disabled: 20 },
        extraLarge: { open: 32, compact: 28, hidden: 24, disabled: 24 },
      }[state.viewportSize]
      return sizes[state.headerState] || 24
    },
  },

  actions: {
    updateViewport() {
      console.log("Updating viewport")
      try {
        if (typeof window !== 'undefined') {
          this.isVertical = window.innerHeight > window.innerWidth
          this.isTouchDevice =
            'ontouchstart' in window || navigator.maxTouchPoints > 0

          const width = window.innerWidth
          console.log("Viewport width:", width)
          if (width < 768) {
            this.viewportSize = 'small'
          } else if (width >= 768 && width < 1024) {
            this.viewportSize = 'medium'
          } else if (width >= 1024 && width < 1440) {
            this.viewportSize = 'large'
          } else {
            this.viewportSize = 'extraLarge'
          }
          console.log("Updated viewport size:", this.viewportSize)
        }
      } catch (error) {
        console.error('Error updating viewport:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },
    toggleTutorial() {
      console.log("Toggling tutorial from", this.showTutorial)
      this.showTutorial = !this.showTutorial
      this.saveState()
      console.log("Toggled tutorial to", this.showTutorial)
    },
    toggleIntro() {
      console.log("Toggling intro from", this.showIntro)
      this.showIntro = !this.showIntro
      this.saveState()
      console.log("Toggled intro to", this.showIntro)
    },

    toggleSidebar(side: 'sidebarLeftState' | 'sidebarRightState') {
      console.log(`Toggling sidebar ${side} from`, this[side])
      try {
        const stateCycle: Record<DisplayState, DisplayState> = {
          hidden: 'open',
          compact: 'hidden',
          open: 'compact',
          disabled: 'hidden',
        }
        this[side] = stateCycle[this[side]]
        console.log(`Toggled sidebar ${side} to`, this[side])
        this.saveState()
      } catch (error) {
        console.error(`Error toggling sidebar ${side}:`, error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    changeState(
      section: 'sidebarLeftState' | 'sidebarRightState' | 'headerState' | 'footerState',
      newState: DisplayState,
    ) {
      console.log(`Changing state for ${section} from`, this[section], "to", newState)
      try {
        this[section] = newState
        this.saveState()
      } catch (error) {
        console.error(`Error changing state for ${section}:`, error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    toggleFooter() {
      console.log("Toggling footer from", this.footerState)
      try {
        const stateCycle: Record<DisplayState, DisplayState> = {
          hidden: 'open',
          open: 'hidden',
          compact: 'hidden',
          disabled: 'hidden',
        }
        this.footerState = stateCycle[this.footerState]
        console.log("Toggled footer to", this.footerState)
        this.saveState()
      } catch (error) {
        console.error('Error toggling footer:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    initialize() {
      console.log("Initializing display state")
      try {
        this.loadState()
        this.updateViewport()
        window.addEventListener('resize', this.updateViewport)
        this.isInitialized = true
        console.log("Display store initialized:", this)
      } catch (error) {
        console.error('Error initializing display state:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    removeViewportWatcher() {
      console.log("Removing viewport watcher")
      try {
        window.removeEventListener('resize', this.updateViewport)
      } catch (error) {
        console.error('Error removing viewport watcher:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    loadState() {
      console.log("Loading display state from localStorage")
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const storedSidebarLeft = localStorage.getItem('sidebarLeftState') as DisplayState
          const storedSidebarRight = localStorage.getItem('sidebarRightState') as DisplayState
          const storedHeaderState = localStorage.getItem('headerState') as DisplayState
          const storedFooterState = localStorage.getItem('footerState') as DisplayState
          const storedShowTutorial = localStorage.getItem('showTutorial')
          const storedShowIntro = localStorage.getItem('showIntro')

          if (storedSidebarLeft) this.sidebarLeftState = storedSidebarLeft
          if (storedSidebarRight) this.sidebarRightState = storedSidebarRight
          if (storedHeaderState) this.headerState = storedHeaderState
          if (storedFooterState) this.footerState = storedFooterState
          if (storedShowTutorial) this.showTutorial = storedShowTutorial === 'true'
          if (storedShowIntro) this.showIntro = storedShowIntro === 'true'
          console.log("Loaded state:", this)
        }
      } catch (error) {
        console.error('Error loading display state from localStorage:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    saveState() {
      console.log("Saving display state to localStorage:", this)
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('sidebarLeftState', this.sidebarLeftState)
          localStorage.setItem('sidebarRightState', this.sidebarRightState)
          localStorage.setItem('headerState', this.headerState)
          localStorage.setItem('footerState', this.footerState)
          localStorage.setItem('showTutorial', String(this.showTutorial))
          localStorage.setItem('showIntro', String(this.showIntro))
        }
      } catch (error) {
        console.error('Error saving display state to localStorage:', error)
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },
  },
})
