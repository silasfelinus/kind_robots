import { defineStore } from 'pinia'
import { useErrorStore, ErrorType } from './errorStore'

// Define the types for state values and other variables
export type DisplayState = 'open' | 'compact' | 'hidden' | 'disabled'
export type FlipState = 'tutorial' | 'main' | 'toTutorial' | 'toMain'
export type FullscreenState = 'nuxt' | 'fullscreen' | 'splash'
export type displayModeState =
  | 'scenario'
  | 'character'
  | 'reward'
  | 'user'
  | 'chat'
  | 'bot'
  | 'pitch'
  | 'art'
  | 'collection'
  | 'resonance'

export type displayActionState =
  | 'gallery'
  | 'card'
  | 'add'
  | 'edit'
  | 'generate'
  | 'interact'

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
  flipState: FlipState
  isFullScreen: boolean
  isMobileViewport: boolean
  isAnimating: boolean
  currentAnimation: string
  resizeTimeout: ReturnType<typeof setTimeout> | null
  fullscreenState: FullscreenState
  bigMode: boolean
  displayMode: displayModeState
  displayAction: displayActionState
  previousRoute: string
  mainComponent: string
}

// Define the valid effect IDs
export type EffectId =
  | 'bubble-effect'
  | 'fizzy-bubbles'
  | 'rain-effect'
  | 'butterfly-animation'

export const useDisplayStore = defineStore('displayStore', {
  state: (): DisplayStoreState => ({
    headerState: 'open',
    sidebarLeftState: 'compact',
    sidebarRightState: 'hidden',
    footerState: 'hidden',
    isVertical: false,
    viewportSize: 'large',
    isTouchDevice: false,
    showTutorial: true,
    isInitialized: false,
    flipState: 'tutorial',
    isFullScreen: false,
    isMobileViewport: true,
    isAnimating: false,
    currentAnimation: '',
    resizeTimeout: null,
    fullscreenState: 'nuxt',
    bigMode: false,
    displayMode: 'scenario',
    displayAction: 'gallery',
    previousRoute: '',
    mainComponent: '',
  }),

  getters: {
    sidebarLeftWidth(): number {
      const sizes = { small: 16, medium: 11, large: 9, extraLarge: 5 }
      return (
        sizes[this.viewportSize] *
        (['open', 'compact'].includes(this.sidebarLeftState) ? 1 : 0)
      )
    },

    sidebarRightWidth(): number {
      const sizes = { small: 2, medium: 40, large: 25, extraLarge: 28 }
      return (
        sizes[this.viewportSize] *
        (['open', 'compact'].includes(this.sidebarRightState) ? 1 : 0)
      )
    },

    headerHeight(): number {
      const sizes = {
        small: this.bigMode ? 10 : 16,
        medium: this.bigMode ? 6 : 10,
        large: this.bigMode ? 7 : 12,
        extraLarge: this.bigMode ? 6 : 10,
      }
      return sizes[this.viewportSize]
    },

    footerHeight(): number {
      const sizes = { small: 8, medium: 6, large: 7, extraLarge: 6 }
      return sizes[this.viewportSize] * (this.footerState === 'open' ? 1 : 0)
    },

    sectionPaddingSize(): number {
      const sizes = { small: 1, medium: 1, large: 1, extraLarge: 0.5 }
      return sizes[this.viewportSize]
    },

    mainContentHeight(): number {
      return 100 - (this.headerHeight + 2 * this.sectionPaddingSize)
    },
    mainContentWidth(): number {
      return (
        100 -
        (this.sidebarRightState !== 'hidden'
          ? this.sidebarRightWidth + this.sectionPaddingSize * 2
          : this.sectionPaddingSize)
      )
    },

    headerStyle(): Record<string, string> {
      return {
        height: `calc(var(--vh) * ${this.headerHeight})`,
        width: `calc(100vw - ${this.sectionPaddingSize * 2}vw)`,
        top: `calc(var(--vh) * ${this.sectionPaddingSize}`,
        left: `${this.sectionPaddingSize}vw`,
      }
    },

    leftToggleStyle(): Record<string, string> {
      return {
        top: `calc(var(--vh) * ${this.headerHeight} + ${this.sectionPaddingSize * 2}vh)`,
        left: `${this.sectionPaddingSize}vw`,
      }
    },

    rightToggleStyle(): Record<string, string> {
      return {
        top: `calc(var(--vh) * ${this.headerHeight} + ${this.sectionPaddingSize * 2}vh)`,
        right: `${this.sectionPaddingSize}vw`,
      }
    },

    footerToggleStyle(): Record<string, string> {
      return {
        bottom: `4vh`,
        left: '50%',
        transform: 'translateX(-50%)',
      }
    },

    leftSidebarStyle(): Record<string, string> {
      return this.sidebarLeftState !== 'hidden'
        ? {
            height: `calc(var(--vh) * ${this.mainContentHeight})`,
            width: `${this.sidebarLeftWidth}vw`,
            top: `calc(var(--vh) * ${this.headerHeight} + ${this.sectionPaddingSize * 2}vh)`,
            left: `${this.sectionPaddingSize}vw`,
          }
        : { width: '0px', height: '0px' }
    },

    rightSidebarStyle(): Record<string, string> {
      return this.sidebarRightState !== 'hidden'
        ? {
            height: `calc(var(--vh) * ${this.mainContentHeight})`,
            width: `${this.sidebarRightWidth}vw`,
            top: `calc(var(--vh) * ${this.headerHeight} + ${this.sectionPaddingSize * 2}vh)`,
            right: `${this.sectionPaddingSize}vw`,
          }
        : { width: '0px', height: '0px' }
    },

    mainContentStyle(): Record<string, string> {
      return {
        height: `calc(var(--vh) * ${this.mainContentHeight})`,
        width: `calc(${this.mainContentWidth}vw)`,
        top: `calc(var(--vh) * ${this.headerHeight} + ${this.sectionPaddingSize * 2}vh)`,
        right:
          this.sidebarRightState !== 'hidden'
            ? `calc(${this.sidebarRightWidth}vw + ${this.sectionPaddingSize * 2}vw)`
            : `${this.sectionPaddingSize}vw`,
        left: `${this.sectionPaddingSize}vw`,
      }
    },

    footerStyle(): Record<string, string> {
      return { height: '0px', width: '0px' }
    },

    //everything after here is probably good
    isLargeViewport(state): boolean {
      return ['large', 'extraLarge'].includes(state.viewportSize)
    },
  },

  actions: {
    handleError(error: unknown) {
      const errorStore = useErrorStore()
      errorStore.setError(ErrorType.GENERAL_ERROR, error)
    },
    toggleBigMode() {
      this.bigMode = !this.bigMode

      this.$patch({
        headerState: this.bigMode ? 'hidden' : 'open',
        sidebarLeftState: this.bigMode ? 'hidden' : 'compact',
        sidebarRightState: this.bigMode ? 'hidden' : 'open',
        footerState: this.bigMode ? 'hidden' : 'open',
      })

      this.saveState()
    },
    setMainComponent(component: string) {
      this.mainComponent = component
    },

    initialize() {
      if (this.isInitialized) {
        return
      }

      try {
        this.loadState()
        this.updateViewport()
        window.addEventListener('resize', this.updateViewport)
        this.isInitialized = true
      } catch (error) {
        this.handleError(error)
      }
    },
    loadState() {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const savedState = localStorage.getItem('displayStoreState')
          if (savedState) {
            const parsedState = JSON.parse(savedState)
            this.$patch(parsedState) // Merge the saved state with the current one
          }
        }
      } catch (error) {
        this.handleError(error)
      }
    },

    toggleFullscreen() {
      if (this.fullscreenState === 'nuxt') {
        // Switch to fullscreen
        this.fullscreenState = 'fullscreen'
        this.isFullScreen = true

        // Close other elements
        this.headerState = 'hidden' // Explicitly hide the header
        this.sidebarLeftState = 'hidden'
        this.sidebarRightState = 'hidden'
        this.footerState = 'hidden'
      } else {
        // Restore previous states
        this.fullscreenState = 'nuxt'
        this.isFullScreen = false
      }

      this.saveState()
    },

    // Function to toggle animation by ID
    toggleAnimationById(animationId: EffectId) {
      this.isAnimating = true
      this.currentAnimation = animationId
    },

    setMode(mode: displayModeState) {
      this.displayMode = mode
      this.saveState()
    },
    setAction(action: displayActionState) {
      this.displayAction = action
      this.saveState()
    },

    // Function to toggle a random animation
    toggleRandomAnimation() {
      const animations: EffectId[] = [
        'bubble-effect',
        'fizzy-bubbles',
        'rain-effect',
        'butterfly-animation',
      ]
      const randomAnimation =
        animations[Math.floor(Math.random() * animations.length)]
      this.isAnimating = true
      this.currentAnimation = randomAnimation
    },

    stopAnimation() {
      this.isAnimating = false
      this.currentAnimation = ''
    },

    updateViewport() {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout) // Clear previous timeout
      }
      this.resizeTimeout = setTimeout(() => {
        try {
          // Set custom viewport height for mobile devices
          this.setCustomVh()

          // Check if we are in a browser environment
          if (typeof window !== 'undefined') {
            // Check if the viewport is vertical
            this.isVertical = window.innerHeight > window.innerWidth

            // Check if the device is a touch device
            this.isTouchDevice =
              'ontouchstart' in window || navigator.maxTouchPoints > 0

            // Adjust viewport size based on window width
            const width = window.innerWidth

            if (width < 768) {
              this.viewportSize = 'small'
              this.isMobileViewport = true
              this.isFullScreen = false
            } else if (width >= 768 && width < 1024) {
              this.viewportSize = 'medium'
              this.isMobileViewport = false
              this.isFullScreen = false
            } else if (width >= 1024 && width < 1440) {
              this.viewportSize = 'large'
              this.isMobileViewport = false
              this.isFullScreen = true
            } else {
              this.viewportSize = 'extraLarge'
              this.isMobileViewport = false
              this.isFullScreen = true
            }
          }
        } catch (error) {
          this.handleError(error)
        } finally {
          this.resizeTimeout = null // Reset timeout after execution
        }
      }, 200) // 200ms debounce delay
    },

    setCustomVh() {
      if (typeof window !== 'undefined') {
        const vh = window.innerHeight * 0.01
        document.documentElement.style.setProperty('--vh', `${vh}px`)
      }
    },

    toggleFlipState() {
      // Manage the flip transition based on current state
      if (this.flipState === 'tutorial') {
        this.flipState = 'toMain'
      } else if (this.flipState === 'main') {
        this.flipState = 'toTutorial'
      }
      this.saveState()
    },

    setFlipState(newState: FlipState) {
      const validStates: FlipState[] = [
        'tutorial',
        'main',
        'toTutorial',
        'toMain',
      ]

      if (validStates.includes(newState)) {
        this.flipState = newState
        this.saveState()
      } else {
        const errorStore = useErrorStore()
        errorStore.setError(
          ErrorType.GENERAL_ERROR,
          `Invalid flip state: ${newState}`,
        )
      }
    },

    completeFlip() {
      if (this.flipState === 'toMain') {
        this.flipState = 'main'
      } else if (this.flipState === 'toTutorial') {
        this.flipState = 'tutorial'
      }
      this.saveState()
    },

    toggleSidebar(side: 'sidebarLeftState' | 'sidebarRightState') {
      const stateCycle: Record<DisplayState, DisplayState> = {
        hidden: 'compact',
        compact: 'hidden',
        open: 'hidden',
        disabled: 'hidden',
      }
      this[side] = stateCycle[this[side]]
      this.saveState()
    },

    toggleFooter() {
      const stateCycle: Record<DisplayState, DisplayState> = {
        hidden: 'open',
        open: 'hidden',
        compact: 'hidden',
        disabled: 'hidden',
      }
      this.footerState = stateCycle[this.footerState]
      this.saveState()
    },

    // Function to set the right sidebar state (open/hidden) without toggling compact
    setSidebarRight(isOpen: boolean) {
      if (isOpen) {
        this.sidebarRightState = 'open'
      } else {
        this.sidebarRightState = 'hidden'
      }
      this.saveState()
    },

    toggleTutorial() {
      if (this.flipState === 'tutorial' || this.flipState === 'toTutorial') {
        this.flipState = 'toMain'
      } else {
        this.flipState = 'toTutorial'
      }

      // Toggle the showTutorial state
      this.showTutorial = !this.showTutorial

      this.saveState()
    },

    changeState(
      section:
        | 'sidebarLeftState'
        | 'sidebarRightState'
        | 'headerState'
        | 'footerState',
      newState: DisplayState,
    ) {
      this[section] = newState
      this.saveState()
    },

    resetInitialization() {
      this.isInitialized = false
    },
    removeViewportWatcher() {
      console.log('Removing viewport watcher...')
      window.removeEventListener('resize', this.updateViewport)
    },

    saveState() {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const stateToSave = {
            ...this.$state,
            resizeTimeout: null, // Exclude transient properties
            isAnimating: false,
            currentAnimation: '',
          }
          localStorage.setItem('displayStoreState', JSON.stringify(stateToSave))
        }
      } catch (error) {
        this.handleError(error)
      }
    },
  },
})
