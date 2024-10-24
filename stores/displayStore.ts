import { defineStore } from 'pinia';
import { useErrorStore, ErrorType } from './../stores/errorStore';

// Define the types for state values and other variables
export type DisplayState = 'open' | 'compact' | 'hidden' | 'disabled';
export type FlipState = 'tutorial' | 'main' | 'toTutorial' | 'toMain';
export type FullscreenState = 'nuxt' | 'fullscreen' | 'splash';

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
  isAnimating: boolean;
  currentAnimation: string;
  resizeTimeout: ReturnType<typeof setTimeout> | null;
  fullscreenState: FullscreenState;
}

// Define the valid effect IDs
export type EffectId = 'bubble-effect' | 'fizzy-bubbles' | 'rain-effect' | 'butterfly-animation';

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
    showIntro: true,
    isInitialized: false,
    flipState: 'tutorial',
    isFullScreen: false,
    isMobileViewport: true,
    isAnimating: false,
    currentAnimation: '',
    resizeTimeout: null,
    fullscreenState: 'nuxt',
  }),

  getters: {
    sectionPadding(): string {
      return '10px';
    },

    sectionPaddingVh(): number {
      if (typeof window !== 'undefined' && window.innerHeight) {
        const vh = (10 / window.innerHeight) * 100;
        return parseFloat(vh.toFixed(2)); // Convert to a number
      }
      return 10; // Fallback to 16px as a number
    },

    sectionPaddingVw(): number {
      if (typeof window !== 'undefined' && window.innerWidth) {
        const vw = (10 / window.innerWidth) * 100;
        return parseFloat(vw.toFixed(2)); // Convert to a number
      }
      return 10; // Fallback to 16px as a number
    },

    sectionPaddingInteger(): number {
      return 10; 
    },

    footerMultiplier(state): number {
      return state.footerState === 'open' ? 2 : 1;
    },

    sidebarLeftMultiplier(state): number {
      return ['open', 'compact'].includes(state.sidebarLeftState) ? 2 : 1;
    },

    sidebarRightMultiplier(state): number {
      return ['open', 'compact'].includes(state.sidebarRightState) ? 2 : 1;
    },
    
    sectionPaddingMultiplier(): number {
      return (
        this.sidebarLeftMultiplier +
        this.sidebarRightMultiplier
      )
    },
    headerVh(state): number {
      const sizes = {
        small: { open: 12, compact: 6, hidden: 1, disabled: 0 },
        medium: { open: 9, compact: 5, hidden: 1, disabled: 0 },
        large: { open: 10, compact: 4, hidden: 1, disabled: 0 },
        extraLarge: { open: 10, compact: 3, hidden: 1, disabled: 0 },
      }[state.viewportSize];

      const value = sizes[state.headerState];
      return value !== undefined ? value : 6;
    },
  
    footerVh(state): number {
      const sizes = {
        small: { open: 15, compact: 1, hidden: 0, disabled: 0 },
        medium: { open: 14, compact: 1, hidden: 0, disabled: 0 },
        large: { open: 10, compact: 1, hidden: 0, disabled: 0 },
        extraLarge: { open: 9, compact: 1, hidden: 0, disabled: 0 },
      }[state.viewportSize];
  
      const value = sizes[state.footerState];
      return value !== undefined ? value : 3;
    },
  
    sidebarLeftVw(state): number {
      const sizes = {
        small: { open: 22, compact: 10, hidden: 0, disabled: 0 },
        medium: { open: 16, compact: 9, hidden: 0, disabled: 0 },
        large: { open: 13, compact: 10, hidden: 0, disabled: 0 },
        extraLarge: { open: 10, compact: 6, hidden: 0, disabled: 0 },
      }[state.viewportSize];
  
      const value = sizes[state.sidebarLeftState];
      return value !== undefined ? value : 16;
    },
  
    sidebarRightVw(state): number {
      const sizes = {
        small: { open: 1, compact: 1, hidden: 0, disabled: 0 },
        medium: { open: 33, compact: 1, hidden: 0, disabled: 0 },
        large: { open: 25, compact: 1, hidden: 0, disabled: 0 },
        extraLarge: { open: 30, compact: 1, hidden: 0, disabled: 0 },
      }[state.viewportSize];
  
      const value = sizes[state.sidebarRightState];
      return value !== undefined ? value : 2;
    },
  
    mainVh(): number {
      return 100 - this.headerVh - this.footerVh - (this.sectionPaddingVh * (this.footerMultiplier + 2));
    },

    mainVw(): number {
      return 100 - this.sidebarLeftVw - this.sidebarRightVw - (this.sectionPaddingVw * this.sectionPaddingMultiplier);
    },

    headerHeight(): string {
      return `calc(var(--vh) * ${this.headerVh})`;
    },

    footerHeight(): string {
      return `calc(var(--vh) * ${this.footerVh})`;
    },

    footerWidth(): string {
      return `calc(100vw - ${this.sectionPaddingVw} * 2)`;
    },

    centerHeight(): string {
      return `calc(var(--vh) * ${this.mainVh})`;
    },

    centerWidth(): string {
      return `calc(${this.mainVw}vw)`;
    },

    sidebarLeftWidth(): string {
      return `${this.sidebarLeftVw}vw`;
    },

    sidebarRightWidth(): string {
      return `${this.sidebarRightVw}vw`;
    },
  

    //everything after here is probably good
    isLargeViewport(state): boolean {
      return ['large', 'extraLarge'].includes(state.viewportSize);
    },
  
    iconSize(state): number {
      const sizes = {
        small: { open: 18, compact: 16, hidden: 14, disabled: 14 },
        medium: { open: 24, compact: 20, hidden: 18, disabled: 18 },
        large: { open: 28, compact: 24, hidden: 20, disabled: 20 },
        extraLarge: { open: 32, compact: 28, hidden: 24, disabled: 24 },
      }[state.viewportSize];
  
      const value = sizes[state.headerState];
      return value !== undefined ? value : 24;
    },
  },
  


  actions: {
    handleError(error: unknown) {
      const errorStore = useErrorStore();
      errorStore.setError(ErrorType.GENERAL_ERROR, error);
    },
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
        this.handleError(error);
      }
    },

    loadState() {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const storedSidebarLeft = localStorage.getItem('sidebarLeftState') as DisplayState;
          const storedSidebarRight = localStorage.getItem('sidebarRightState') as DisplayState;
          const storedHeaderState = localStorage.getItem('headerState') as DisplayState;
          const storedFooterState = localStorage.getItem('footerState') as DisplayState;
          const storedShowTutorial = localStorage.getItem('showTutorial');
          const storedShowIntro = localStorage.getItem('showIntro');
          const storedFullScreen = localStorage.getItem('isFullScreen');
          const storedFlipState = localStorage.getItem('flipState') as FlipState;

          if (storedFlipState) this.flipState = storedFlipState;
          if (storedSidebarLeft) this.sidebarLeftState = storedSidebarLeft;
          if (storedSidebarRight) this.sidebarRightState = storedSidebarRight;
          if (storedHeaderState) this.headerState = storedHeaderState;
          if (storedFooterState) this.footerState = storedFooterState;
          if (storedShowTutorial) this.showTutorial = storedShowTutorial === 'true';
          if (storedFullScreen) this.isFullScreen = storedFullScreen === 'true';
          if (storedShowIntro) this.showIntro = storedShowIntro === 'true';
        }
      } catch (error) {
        this.handleError(error);
      }
    },

    toggleFullScreen() {
      if (this.fullscreenState === 'nuxt') {
        // Move to fullscreen state
        this.fullscreenState = 'fullscreen';
        this.isFullScreen = true;
        this.sidebarRightState = 'open'; 
        this.showTutorial = true;
      } else if (this.fullscreenState === 'fullscreen') {
        // Move to splash state
        this.fullscreenState = 'splash';
        this.sidebarRightState = 'hidden'; 
        this.isFullScreen = false;
        this.showTutorial = true;
      } else {
        // Move back to nuxt state
        this.fullscreenState = 'nuxt';
        this.isFullScreen = false;
        this.sidebarRightState = 'hidden'
        this.showTutorial = false;
      }

      this.saveState(); 
    },

    // Function to toggle animation by ID
    toggleAnimationById(animationId: EffectId) {
      this.isAnimating = true;
      this.currentAnimation = animationId;
    },

    // Function to toggle a random animation
    toggleRandomAnimation() {
      const animations: EffectId[] = ['bubble-effect', 'fizzy-bubbles', 'rain-effect', 'butterfly-animation'];
      const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
      this.isAnimating = true;
      this.currentAnimation = randomAnimation;
    },

    stopAnimation() {
      this.isAnimating = false;
      this.currentAnimation = '';
    },

    updateViewport() {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout); // Clear previous timeout
      }
      this.resizeTimeout = setTimeout(() => {
        try {
          // Set custom viewport height for mobile devices
          this.setCustomVh();

          // Check if we are in a browser environment
          if (typeof window !== 'undefined') {
            // Check if the viewport is vertical
            this.isVertical = window.innerHeight > window.innerWidth;

            // Check if the device is a touch device
            this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

            // Adjust viewport size based on window width
            const width = window.innerWidth;

            if (width < 768) {
              this.viewportSize = 'small';
              this.isMobileViewport = true;
              this.isFullScreen = false;
            } else if (width >= 768 && width < 1024) {
              this.viewportSize = 'medium';
              this.isMobileViewport = false;
              this.isFullScreen = false;
            } else if (width >= 1024 && width < 1440) {
              this.viewportSize = 'large';
              this.isMobileViewport = false;
              this.isFullScreen = true;
            } else {
              this.viewportSize = 'extraLarge';
              this.isMobileViewport = false;
              this.isFullScreen = true;
            }
          }
        } catch (error) {
          this.handleError(error);
        } finally {
          this.resizeTimeout = null; // Reset timeout after execution
        }
      }, 200); // 200ms debounce delay
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
        this.flipState = 'toMain';
      } else if (this.flipState === 'main') {
        this.flipState = 'toTutorial';
      }
      this.saveState();
    },

    setFlipState(newState: FlipState) {
      const validStates: FlipState[] = ['tutorial', 'main', 'toTutorial', 'toMain'];

      if (validStates.includes(newState)) {
        this.flipState = newState;
        this.saveState();
      } else {
        const errorStore = useErrorStore();
        errorStore.setError(ErrorType.GENERAL_ERROR, `Invalid flip state: ${newState}`);
      }
    },

    completeFlip() {
      if (this.flipState === 'toMain') {
        this.flipState = 'main';
      } else if (this.flipState === 'toTutorial') {
        this.flipState = 'tutorial';
      }
      this.saveState();
    },

    toggleSidebar(side: 'sidebarLeftState' | 'sidebarRightState') {
      const stateCycle: Record<DisplayState, DisplayState> = {
        hidden: 'compact',
        compact: 'hidden',
        open: 'hidden',
        disabled: 'hidden',
      };
      this[side] = stateCycle[this[side]];
      this.saveState();
    },

    toggleFooter() {
      const stateCycle: Record<DisplayState, DisplayState> = {
        hidden: 'open',
        open: 'hidden',
        compact: 'hidden',
        disabled: 'hidden',
      };
      this.footerState = stateCycle[this.footerState];
      this.saveState();
    },

      // Function to set the right sidebar state (open/hidden) without toggling compact
    setSidebarRight(isOpen: boolean) {
      if (isOpen) {
        this.sidebarRightState = 'open';
      } else {
        this.sidebarRightState = 'hidden';
      }
      this.saveState();
    },

    toggleTutorial() {

      if (this.flipState === 'tutorial' || this.flipState === 'toTutorial') {
        this.flipState = 'toMain';
      } else {
        this.flipState = 'toTutorial';
      }
    
      // Toggle the showTutorial state
      this.showTutorial = !this.showTutorial;
    
      this.saveState();
    },
    
    toggleIntro() {
      this.showIntro = !this.showIntro;
      this.saveState();
    },

    changeState(section: 'sidebarLeftState' | 'sidebarRightState' | 'headerState' | 'footerState', newState: DisplayState) {
      this[section] = newState;
      this.saveState();
    },

    resetInitialization() {
      this.isInitialized = false;
    },
    removeViewportWatcher() {
      console.log('Removing viewport watcher...');
      window.removeEventListener('resize', this.updateViewport);
    },


    saveState() {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('sidebarLeftState', this.sidebarLeftState);
          localStorage.setItem('sidebarRightState', this.sidebarRightState);
          localStorage.setItem('headerState', this.headerState);
          localStorage.setItem('footerState', this.footerState);
          localStorage.setItem('showTutorial', String(this.showTutorial));
          localStorage.setItem('isFullScreen', String(this.isFullScreen));
          localStorage.setItem('showIntro', String(this.showIntro));
          localStorage.setItem('flipState', this.flipState);
        }
      } catch (error) {
        this.handleError(error);
      }
    },
  },
});
