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
  modeRowHeight: number
}

// Define the valid effect IDs
export type EffectId =
  | 'bubble-effect'
  | 'fizzy-bubbles'
  | 'rain-effect'
  | 'butterfly-animation'

export const useDisplayStore = defineStore('display', {
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
    modeRowHeight: 16,
  }),

  getters: {
sidebarLeftBase(): number {
  const sizes = {
    small: { open: 19, compact: 10, hidden: 0, disabled: 0 },
    medium: { open: 14, compact: 9, hidden: 0, disabled: 0 },
    large: { open: 13, compact: 10, hidden: 0, disabled: 0 },
    extraLarge: { open: 8, compact: 6, hidden: 0, disabled: 0 },
  };
  return sizes[this.viewportSize]?.[this.sidebarLeftState] ?? 16;
},

sidebarRightBase(): number {
  const sizes = {
    small: { open: 1, compact: 1, hidden: 0, disabled: 0 },
    medium: { open: 33, compact: 1, hidden: 0, disabled: 0 },
    large: { open: 25, compact: 1, hidden: 0, disabled: 0 },
    extraLarge: { open: 30, compact: 1, hidden: 0, disabled: 0 },
  };
  return sizes[this.viewportSize]?.[this.sidebarRightState] ?? 2;
},

headerBase(): number {
  const sizes = {
    small: { open: 9, compact: 6, hidden: 0, disabled: 0 },
    medium: { open: 10, compact: 5, hidden: 0, disabled: 0 },
    large: { open: 13, compact: 4, hidden: 0, disabled: 0 },
    extraLarge: { open: 10, compact: 3, hidden: 0, disabled: 0 },
  };
  return sizes[this.viewportSize]?.[this.headerState] ?? 6;
},

footerBase(): number {
  const sizes = {
    small: { open: 15, compact: 1, hidden: 0, disabled: 0 },
    medium: { open: 9, compact: 1, hidden: 0, disabled: 0 },
    large: { open: 12, compact: 1, hidden: 0, disabled: 0 },
    extraLarge: { open: 9, compact: 1, hidden: 0, disabled: 0 },
  };
  return sizes[this.viewportSize]?.[this.footerState] ?? 3;
},

sectionPaddingBase(): number {
  const sizes = {
    small: 2,
    medium: 4,
    large: 6,
    extraLarge: 8,
  };
  return sizes[this.viewportSize] ?? 6;
},

modeRowBase(): number {
  const sizes = {
    small: 48,
    medium: 56,
    large: 64,
    extraLarge: 72,
  };
  return sizes[this.viewportSize] ?? 56;
},

headerHeight(): string {
  return `calc(var(--vh) * ${this.headerBase()})`;
},

footerHeight(): string {
  return `calc(var(--vh) * ${this.footerBase()})`;
},

centerHeight(): string {
  return `calc(var(--vh) * ${this.baseMainHeight()})`;
},

centerWidth(): string {
  return `${this.baseMainWidth()}vw`;
},

sidebarLeftWidth(): string {
  return `${this.sidebarLeftBase()}vw`;
},

sidebarRightWidth(): string {
  return `${this.sidebarRightBase()}vw`;
},

// Adjust section padding to be viewport-based for consistency
sectionPaddingVh(): string {
  return `calc(var(--vh) * ${this.sectionPaddingBase()})`;
},

sectionPaddingVw(): string {
  return `calc(1vw * ${this.sectionPaddingBase()})`;
},

// Mode Row dimensions
modeRowHeight(): string {
  return `${this.modeRowBase()}px`;
},

modeRowWidth(): string {
  return `${this.centerWidth()}`;
},

// Main Content dimensions (adjusting for mode row height)
mainContentHeight(): string {
  return `calc(${this.centerHeight()} - ${this.modeRowHeight()})`;
},

mainContentWidth(): string {
  return `${this.centerWidth()}`;
},





    sidebarLeftVisible(this: DisplayStoreState): boolean {
      return (
        this.sidebarLeftState === 'open' || this.sidebarLeftState === 'compact'
      )
    },

    sidebarRightVisible(this: DisplayStoreState): boolean {
      return (
        this.sidebarRightState === 'open' ||
        this.sidebarRightState === 'compact'
      )
    },

    footerVisible(this: DisplayStoreState): boolean {
      return this.footerState === 'open'
    },

    headerStyle(): Record<string, string> {
  return {
    height: this.headerVisible ? this.headerHeight() : '0px',
    width: `calc(100vw - (${this.sectionPaddingVw()} * 2))`,
    top: this.sectionPaddingVh(),
    left: this.sectionPaddingVw(),
    right: this.sectionPaddingVw(),
  };
},

leftSidebarStyle(): Record<string, string> {
  return this.sidebarLeftVisible
    ? {
        height: this.centerHeight(),
        width: this.sidebarLeftWidth(),
        top: `calc(${this.headerHeight()} + ${this.sectionPaddingVh()})`,
        left: this.sectionPaddingVw(),
      }
    : { width: '0px', height: '0px' };
},

modeRowStyle(): Record<string, string> {
  return {
    height: this.modeRowHeight(),
    width: `calc(${this.modeRowWidth()} - (${this.sectionPaddingVw()} * 2))`,
    top: `calc(${this.headerHeight()} + ${this.sectionPaddingVh()} + ${this.sectionPaddingVh()})`,
    right: this.sidebarRightVisible ? `calc(${this.sidebarRightWidth()} + ${this.sectionPaddingVw()})` : this.sectionPaddingVw(),
    left: this.sectionPaddingVw(),
  };
},

mainContentStyle(): Record<string, string> {
  return {
    height: this.mainContentHeight(),
    width: `calc(${this.mainContentWidth()} - (${this.sectionPaddingVw()} * 2))`,
    top: `calc(${this.headerHeight()} + ${this.modeRowHeight()} + (${this.sectionPaddingVh()} * 2))`,
    right: this.sidebarRightVisible ? `calc(${this.sidebarRightWidth()} + ${this.sectionPaddingVw()})` : this.sectionPaddingVw(),
    left: this.sidebarLeftVisible ? `calc(${this.sidebarLeftWidth()} + ${this.sectionPaddingVw()})` : this.sectionPaddingVw(),
  };
},

rightSidebarStyle(): Record<string, string> {
  return this.sidebarRightVisible
    ? {
        height: this.centerHeight(),
        width: this.sidebarRightWidth(),
        top: `calc(${this.headerHeight()} + ${this.sectionPaddingVh()})`,
        right: this.sectionPaddingVw(),
      }
    : { width: '0px', height: '0px' };
},

footerStyle(): Record<string, string> {
  return this.footerVisible
    ? {
        height: this.footerHeight(),
        width: `calc(100vw - (${this.sectionPaddingVw()} * 2))`,
        bottom: this.sectionPaddingVh(),
        left: this.sectionPaddingVw(),
        right: this.sectionPaddingVw(),
      }
    : { height: '0px', width: '0px' };
},

    
    
    footerMultiplier(state): number {
      return state.footerState === 'open' ? 2 : 1
    },

    sidebarLeftMultiplier(state): number {
      return ['open', 'compact'].includes(state.sidebarLeftState) ? 2 : 1
    },

    sidebarRightMultiplier(state): number {
      return ['open', 'compact'].includes(state.sidebarRightState) ? 2 : 1
    },

    sectionPaddingMultiplier(): number {
      return this.sidebarLeftMultiplier + this.sidebarRightMultiplier
    },
    




    //everything after here is probably good
    isLargeViewport(state): boolean {
      return ['large', 'extraLarge'].includes(state.viewportSize)
    },

    iconSize(state): number {
      const sizes = {
        small: { open: 18, compact: 16, hidden: 14, disabled: 14 },
        medium: { open: 24, compact: 20, hidden: 18, disabled: 18 },
        large: { open: 28, compact: 24, hidden: 20, disabled: 20 },
        extraLarge: { open: 32, compact: 28, hidden: 24, disabled: 24 },
      }[state.viewportSize]

      const value = sizes[state.headerState]
      return value !== undefined ? value : 24
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
        sidebarRightState: this.bigMode ? 'hidden' : 'hidden',
        footerState: this.bigMode ? 'hidden' : 'hidden',
      })

      console.log('Big Mode:', this.bigMode, 'Header State:', this.headerState)
      this.saveState()
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
