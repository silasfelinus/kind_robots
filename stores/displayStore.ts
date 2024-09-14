import { defineStore } from 'pinia'

// Define the type for possible display states
type DisplayState = 'open' | 'compact' | 'hidden' | 'disabled'

// Define the interface for the store state
interface DisplayStoreState {
  headerState: DisplayState
  sidebarLeft: DisplayState
  sidebarRight: DisplayState
  footer: DisplayState
  focusedContainer: 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer' | null
  headerFocused: boolean
  sidebarLeftFocused: boolean
  sidebarRightFocused: boolean
  footerFocused: boolean
  showIntro: boolean
}

export const useDisplayStore = defineStore('display', {
  state: (): DisplayStoreState => ({
    headerState: 'open',     // Default states
    sidebarLeft: 'hidden',
    sidebarRight: 'hidden',
    footer: 'hidden',
    focusedContainer: null,  // No container focused initially
    headerFocused: false,
    sidebarLeftFocused: false,
    sidebarRightFocused: false,
    footerFocused: false,
    showIntro: localStorage.getItem('showIntro') === 'false' ? false : true // Show intro by default
  }),

  getters: {
    isHeaderVisible: (state) => state.headerState !== 'hidden',
    isSidebarLeftVisible: (state) => state.sidebarLeft !== 'hidden',
    isSidebarRightVisible: (state) => state.sidebarRight !== 'hidden',
    isFooterVisible: (state) => state.footer !== 'hidden',
    allSectionsFocused: (state) => state.headerFocused && state.sidebarLeftFocused && state.sidebarRightFocused && state.footerFocused
  },

  actions: {
    setFocus(container: 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer') {
      this.focusedContainer = container
      if (container === 'headerState') this.headerFocused = true
      if (container === 'sidebarLeft') this.sidebarLeftFocused = true
      if (container === 'sidebarRight') this.sidebarRightFocused = true
      if (container === 'footer') this.footerFocused = true

      this[container] = 'open'

      const containers: Array<'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer'> = ['headerState', 'sidebarLeft', 'sidebarRight', 'footer']
      containers.forEach((key) => {
        if (key !== container) {
          this[key] = this[key] !== 'disabled' ? (key === 'footer' ? 'hidden' : 'compact') : this[key]
        }
      })
    },

    clearFocus() {
      this.focusedContainer = null
      this.resetStates()
    },

    changeState(container: 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer', state: DisplayState) {
      if (['open', 'compact', 'hidden', 'disabled'].includes(state)) {
        this[container] = state
      }
    },

    resetStates() {
      this.headerState = 'open'
      this.sidebarLeft = 'hidden'
      this.sidebarRight = 'hidden'
      this.footer = 'hidden'
      this.focusedContainer = null
    },

    toggleIntroState() {
      this.showIntro = !this.showIntro
      localStorage.setItem('showIntro', JSON.stringify(this.showIntro))
    }
  },
})
