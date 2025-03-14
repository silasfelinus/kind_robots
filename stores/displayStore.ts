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
        height:
          this.headerState === 'hidden' ? '0px' : this.headerHeight || '56px', // Ensure a fallback height
        opacity: this.headerState === 'hidden' ? '0' : '1',
        overflow: 'hidden',
        transition: 'height 0.3s ease-in-out, opacity 0.3s ease-in-out',
      }
    },

    modeRowStyle(): Record<string, string> {
      return {
        height: '56px',
        overflow: 'hidden',
        transition: 'height 0.3s ease-in-out, opacity 0.3s ease-in-out',
        width: this.centerWidth,
      }
    },

    leftSidebarStyle(): Record<string, string> {
      return {
        height: this.centerHeight,
        width: this.sidebarLeftWidth,
        top: `calc(${this.headerHeight} + (${this.sectionPadding} * 2))`,
        left: this.sectionPadding,
      }
    },

    mainContentStyle(): Record<string, string> {
      return {
        height: this.centerHeight,
        width: this.centerWidth,
        top: `calc(${this.headerHeight} + (${this.sectionPadding} * 2))`,
        right: this.sidebarRightVisible
          ? `calc(${this.sidebarRightWidth} + (${this.sectionPadding} * 2))`
          : this.sectionPadding,
      }
    },

    rightSidebarStyle(): Record<string, string> {
      return {
        height: this.centerHeight,
        width: this.sidebarRightWidth,
        top: `calc(${this.headerHeight} + (${this.sectionPadding} * 2))`,
        right: this.sectionPadding,
      }
    },

    footerStyle(): Record<string, string> {
      return {
        height: this.footerHeight,
        width: `calc(100vw - (${this.sectionPaddingVw} * 2))`,
        bottom: this.sectionPadding,
        left: this.sectionPadding,
        right: this.sectionPadding,
      }
    },
    sectionPaddingSizes(): Record<
      'small' | 'medium' | 'large' | 'extraLarge',
      number
    > {
      return {
        small: 2,
        medium: 4,
        large: 6,
        extraLarge: 8,
      }
    },

    // Numeric section padding based on viewport size
    sectionPaddingNumeric(state): number {
      const sizes = this.sectionPaddingSizes
      return sizes[state.viewportSize] || 6
    },

    sectionPadding(): string {
      return `${this.sectionPaddingNumeric}px`
    },

    // Section padding as a percentage of viewport height
    sectionPaddingVh(): number {
      if (typeof window !== 'undefined' && window.innerHeight) {
        const padding = this.sectionPaddingNumeric
        return (padding / window.innerHeight) * 100
      }
      return 6
    },

    // Section padding as a percentage of viewport width
    sectionPaddingVw(): number {
      if (typeof window !== 'undefined' && window.innerWidth) {
        const padding = this.sectionPaddingNumeric
        return (padding / window.innerWidth) * 100
      }
      return 6
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
    headerVh(state): number {
      const sizes = {
        small: { open: 9, compact: 6, hidden: 0, disabled: 0 },
        medium: { open: 10, compact: 5, hidden: 0, disabled: 0 },
        large: { open: 13, compact: 4, hidden: 0, disabled: 0 },
        extraLarge: { open: 10, compact: 3, hidden: 0, disabled: 0 },
      }[state.viewportSize]

      const value = sizes[state.headerState]
      return value !== undefined ? value : 6
    },

    footerVh(state): number {
      const sizes = {
        small: { open: 15, compact: 1, hidden: 0, disabled: 0 },
        medium: { open: 9, compact: 1, hidden: 0, disabled: 0 },
        large: { open: 12, compact: 1, hidden: 0, disabled: 0 },
        extraLarge: { open: 9, compact: 1, hidden: 0, disabled: 0 },
      }[state.viewportSize]

      const value = sizes[state.footerState]
      return value !== undefined ? value : 3
    },

    sidebarLeftVw(state): number {
      const sizes = {
        small: { open: 19, compact: 10, hidden: 0, disabled: 0 },
        medium: { open: 14, compact: 9, hidden: 0, disabled: 0 },
        large: { open: 13, compact: 10, hidden: 0, disabled: 0 },
        extraLarge: { open: 8, compact: 6, hidden: 0, disabled: 0 },
      }[state.viewportSize]

      const value = sizes[state.sidebarLeftState]
      return value !== undefined ? value : 16
    },

    sidebarRightVw(state): number {
      const sizes = {
        small: { open: 1, compact: 1, hidden: 0, disabled: 0 },
        medium: { open: 33, compact: 1, hidden: 0, disabled: 0 },
        large: { open: 25, compact: 1, hidden: 0, disabled: 0 },
        extraLarge: { open: 30, compact: 1, hidden: 0, disabled: 0 },
      }[state.viewportSize]

      const value = sizes[state.sidebarRightState]
      return value !== undefined ? value : 2
    },

    mainVh(): number {
      return (
        100 -
        this.headerVh -
        this.footerVh -
        this.sectionPaddingVh * (this.footerMultiplier + 2)
      )
    },

    mainVw(): number {
      return (
        100 -
        this.sidebarLeftVw -
        this.sidebarRightVw -
        this.sectionPaddingVw * this.sectionPaddingMultiplier
      )
    },

    headerHeight(): string {
      return `calc(var(--vh) * ${this.headerVh})`
    },

    footerHeight(): string {
      return `calc(var(--vh) * ${this.footerVh})`
    },

    footerWidth(): string {
      return `calc(100vw - ${this.sectionPaddingVw} * 2)`
    },

    centerHeight(): string {
      return `calc(var(--vh) * ${this.mainVh})`
    },

    centerWidth(): string {
      return `calc(${this.mainVw}vw)`
    },

    sidebarLeftWidth(): string {
      return `${this.sidebarLeftVw}vw`
    },

    sidebarRightWidth(): string {
      return `${this.sidebarRightVw}vw`
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
