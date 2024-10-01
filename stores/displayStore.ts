import { defineStore } from 'pinia'
import { useErrorStore, ErrorType } from './../stores/errorStore'

// Define the types for state values and other variables
export type DisplayState = 'open' | 'compact' | 'hidden' | 'disabled'
export type FlipState = 'tutorial' | 'main' | 'toTutorial' | 'toMain'

interface DisplayStoreState {
  headerState: DisplayState;
  sidebarLeftState: DisplayState;
  sidebarRightState: DisplayState;
  footerState: DisplayState;
  isVertical: boolean;
  viewportSize: 'small' | 'medium' | 'large' | 'extraLarge';
  isTouchDevice: boolean;
  showTutorial: boolean;
  showIntro: boolean;
  isInitialized: boolean;
  flipState: FlipState;
  isFullScreen: boolean;
  isMobileViewport: boolean;
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
    showTutorial: true,
    showIntro: true,
    isInitialized: false,
    flipState: 'tutorial',
    isFullScreen: false,
    isMobileViewport: true,
  }),

  getters: {
    headerVh(state): number {
      const sizes = {
        small: { open: 11, compact: 6, hidden: 1, disabled: 0 },
        medium: { open: 10, compact: 5, hidden: 1, disabled: 0 },
        large: { open: 9, compact: 4, hidden: 1, disabled: 0 },
        extraLarge: { open: 8, compact: 3, hidden: 1, disabled: 0 },
      }[state.viewportSize];
      return sizes[state.headerState] || 6;
    },

    footerVh: (state): number => {
      const sizes = {
        small: { open: 3, compact: 2, hidden: 1, disabled: 0 },
        medium: { open: 2, compact: 1, hidden: 1, disabled: 0 },
        large: { open: 2, compact: 1, hidden: 1, disabled: 0 },
        extraLarge: { open: 1, compact: 0.5, hidden: 1, disabled: 0 },
      }[state.viewportSize];
      return sizes[state.footerState] || 2;
    },

    sidebarLeftVw: (state): number => {
      const sizes = {
        small: { open: 24, compact: 12, hidden: 1, disabled: 0 },
        medium: { open: 21, compact: 10, hidden: 1, disabled: 0 },
        large: { open: 16, compact: 8, hidden: 1, disabled: 0 },
        extraLarge: { open: 13, compact: 6, hidden: 1, disabled: 0 },
      }[state.viewportSize]
      return sizes[state.sidebarLeftState] || 16
    },

    sidebarRightVw: (state): number => {
      const sizes = {
        small: { open: 3, compact: 2, hidden: 1, disabled: 0 },
        medium: { open: 3, compact: 2, hidden: 1, disabled: 0 },
        large: { open: 3, compact: 2, hidden: 1, disabled: 0 },
        extraLarge: { open: 3, compact: 2, hidden: 1, disabled: 0 },
      }[state.viewportSize]
      return sizes[state.sidebarRightState] || 2
    },

    mainVh(): number { 
      return 100 - this.headerVh  - this.footerVh
    },
    mainVw(): number { 
      return 100 - this.sidebarLeftVw  - this.sidebarRightVw
    },
  

    headerHeight(): string {
      return `calc(var(--vh, 1vh) * ${this.headerVh})`;
    },

    mainHeight(): string {
      return `calc(var(--vh, 1vh) * (${this.mainVh})`;
    },


    mainWidth(): string { 
      return `calc(var(--vw, 1vw) * (${this.mainVw})`;
    },
    footerHeight(): string {
      return `calc(var(--vh, 1vh) * ${this.footerVh})`;
    },
    sidebarLeftWidth(): string {
      return `${this.sidebarLeftVw}vw`;
    },

    sidebarRightWidth(): string {
      return `${this.sidebarRightVw}vw`;
    },
gridColumns() {
      if (this.isFullScreen) {
        return `${this.sidebarLeftVw}vw calc(100vw - ${this.sidebarLeftVw}vw - ${this.sidebarRightVw}vw) ${this.sidebarRightVw}vw`;
      } else {
        return `100%`; 
      }
    },
  
    isLargeViewport: (state): boolean => ['large', 'extraLarge'].includes(state.viewportSize),

    iconSize: (state): number => {
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
    initialize() {
      if (this.isInitialized) {
        return; // Skip initialization if already initialized
      }
      
      try {
        this.loadState();
        this.updateViewport();
        window.addEventListener('resize', this.updateViewport);
        this.isInitialized = true;
      } catch (error) {
        const errorStore = useErrorStore();
        errorStore.setError(ErrorType.GENERAL_ERROR, error);
      }
    },

    loadState() {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const storedSidebarLeft = localStorage.getItem('sidebarLeftState') as DisplayState
          const storedSidebarRight = localStorage.getItem('sidebarRightState') as DisplayState
          const storedHeaderState = localStorage.getItem('headerState') as DisplayState
          const storedFooterState = localStorage.getItem('footerState') as DisplayState
          const storedShowTutorial = localStorage.getItem('showTutorial')
          const storedShowIntro = localStorage.getItem('showIntro') 
          const storedFullScreen = localStorage.getItem('isFullScreen') 
          const storedFlipState = localStorage.getItem('flipState') as FlipState

        
          if (storedFlipState) this.flipState = storedFlipState
          if (storedSidebarLeft) this.sidebarLeftState = storedSidebarLeft
          if (storedSidebarRight) this.sidebarRightState = storedSidebarRight
          if (storedHeaderState) this.headerState = storedHeaderState
          if (storedFooterState) this.footerState = storedFooterState
          if (storedShowTutorial) this.showTutorial = storedShowTutorial === 'true'
          if (storedFullScreen) this.isFullScreen = storedFullScreen === 'true'
          if (storedShowIntro) this.showIntro = storedShowIntro === 'true' 
        }
      } catch (error) {
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    toggleFullScreen() {
      this.isFullScreen = !this.isFullScreen;
      this.saveState(); // Optionally, save state to localStorage
    },
    updateViewport() {
      try {
        this.setCustomVh(); 
        if (typeof window !== 'undefined') {
          this.isVertical = window.innerHeight > window.innerWidth
          this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
          const width = window.innerWidth
          if (width < 768) {
            this.viewportSize = 'small'
            this.isMobileViewport = true;
          } else if (width >= 768 && width < 1024) {
            this.viewportSize = 'medium'
            this.isMobileViewport = false;
          } else if (width >= 1024 && width < 1440) {
            this.viewportSize = 'large'
            this.isMobileViewport = false;
          } else {
            this.viewportSize = 'extraLarge'
            this.isMobileViewport = false;
          }
        }
      } catch (error) {
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },
    setCustomVh() {
      if (typeof window !== 'undefined') {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
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
      // Validate if the new state is one of the allowed flip states
      const validStates: FlipState[] = ['tutorial', 'main', 'toTutorial', 'toMain'];
    
      if (validStates.includes(newState)) {
        this.flipState = newState;
        this.saveState(); // Save the state to persist it if needed
      } else {
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR,'Invalid flip state provided:'+ newState);
      }
    },
    

    completeFlip() {
      // Called when the flip animation completes
      if (this.flipState === 'toMain') {
        this.flipState = 'main'
      } else if (this.flipState === 'toTutorial') {
        this.flipState = 'tutorial'
      }
      this.saveState()
    },
    removeViewportWatcher() {
      try {
        window.removeEventListener('resize', this.updateViewport)
      } catch (error) {
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },


    toggleSidebar(side: 'sidebarLeftState' | 'sidebarRightState') {
      try {
        const stateCycle: Record<DisplayState, DisplayState> = {
          hidden: 'open',
          compact: 'hidden',
          open: 'compact',
          disabled: 'hidden',
        }
        this[side] = stateCycle[this[side]]
        this.saveState()
      } catch (error) {
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    toggleFooter() {
      try {
        const stateCycle: Record<DisplayState, DisplayState> = {
          hidden: 'open',
          open: 'hidden',
          compact: 'hidden',
          disabled: 'hidden',
        }
        this.footerState = stateCycle[this.footerState]
        this.saveState()
      } catch (error) {
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },

    toggleTutorial() {
      if (this.flipState === 'tutorial' || this.flipState === 'toTutorial') {
        this.flipState = 'toMain';
      } else {
        this.flipState = 'toTutorial';
      }
      this.showTutorial = !this.showTutorial
      this.saveState();
    },

    toggleIntro() {
      this.showIntro = !this.showIntro
      this.saveState()
    },

    changeState(section: 'sidebarLeftState' | 'sidebarRightState' | 'headerState' | 'footerState', newState: DisplayState) { 
      this[section] = newState
      this.saveState()
    },


    saveState() {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('sidebarLeftState', this.sidebarLeftState)
          localStorage.setItem('sidebarRightState', this.sidebarRightState)
          localStorage.setItem('headerState', this.headerState)
          localStorage.setItem('footerState', this.footerState)
          localStorage.setItem('showTutorial', String(this.showTutorial))
          localStorage.setItem('isFullScreen', String(this.isFullScreen))
          localStorage.setItem('showIntro', String(this.showIntro))
          localStorage.setItem('flipState', this.flipState)
        }
      } catch (error) {
        const errorStore = useErrorStore()
        errorStore.setError(ErrorType.GENERAL_ERROR, error)
      }
    },
  },
})
