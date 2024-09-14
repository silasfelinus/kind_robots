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
    headerState: (localStorage.getItem('headerState') as DisplayState) || 'open',  // Retrieve initial state from localStorage or default to 'open'
    sidebarLeft: (localStorage.getItem('sidebarLeft') as DisplayState) || 'hidden',
    sidebarRight: (localStorage.getItem('sidebarRight') as DisplayState) || 'hidden',
    footer: (localStorage.getItem('footer') as DisplayState) || 'hidden',
    focusedContainer: null,
    headerFocused: false,
    sidebarLeftFocused: false,
    sidebarRightFocused: false,
    footerFocused: false,
    showIntro: localStorage.getItem('showIntro') === 'false' ? false : true // Show intro by default unless previously dismissed
  }),

  getters: {
    isHeaderVisible: (state) => state.headerState !== 'hidden',
    isSidebarLeftVisible: (state) => state.sidebarLeft !== 'hidden',
    isSidebarRightVisible: (state) => state.sidebarRight !== 'hidden',
    isFooterVisible: (state) => state.footer !== 'hidden',
    allSectionsFocused: (state) => state.headerFocused && state.sidebarLeftFocused && state.sidebarRightFocused && state.footerFocused
  },

  actions: {
    /**
     * Set focus to a specific container and mark it as focused.
     * The focused container will open, and the other containers will be set to compact or hidden.
     * @param {'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer'} container - The container to focus.
     */
    setFocus(container: 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer') {
      this.focusedContainer = container
      if (container === 'headerState') this.headerFocused = true
      if (container === 'sidebarLeft') this.sidebarLeftFocused = true
      if (container === 'sidebarRight') this.sidebarRightFocused = true
      if (container === 'footer') this.footerFocused = true

      this[container] = 'open'
      localStorage.setItem(container, 'open')  // Persist the open state

      const containers: Array<'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer'> = ['headerState', 'sidebarLeft', 'sidebarRight', 'footer']
      containers.forEach((key) => {
        if (key !== container) {
          const newState = this[key] !== 'disabled' ? (key === 'footer' ? 'hidden' : 'compact') : this[key]
          this[key] = newState
          localStorage.setItem(key, newState)  // Persist the new state
        }
      })
    },

    /**
     * Clears focus and returns all containers to their default states.
     */
    clearFocus() {
      this.focusedContainer = null
      this.resetStates()
    },

    /**
     * Change the state of a specific container to the desired state.
     * @param {'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer'} container - The container to change.
     * @param {DisplayState} state - The new state for the container.
     */
    changeState(container: 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer', state: DisplayState) {
      if (['open', 'compact', 'hidden', 'disabled'].includes(state)) {
        this[container] = state
        localStorage.setItem(container, state)  // Persist the state change
      }
    },

    /**
     * Reset all containers to their default states.
     */
    resetStates() {
      this.headerState = 'open'
      this.sidebarLeft = 'hidden'
      this.sidebarRight = 'hidden'
      this.footer = 'hidden'
      this.focusedContainer = null
      localStorage.setItem('headerState', 'open')
      localStorage.setItem('sidebarLeft', 'hidden')
      localStorage.setItem('sidebarRight', 'hidden')
      localStorage.setItem('footer', 'hidden')
    },

    /**
     * Toggle the intro state and save it to localStorage.
     */
    toggleIntroState() {
      this.showIntro = !this.showIntro
      localStorage.setItem('showIntro', JSON.stringify(this.showIntro))
    }
  },
})
