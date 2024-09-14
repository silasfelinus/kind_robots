import { defineStore } from 'pinia'

// Define the type for possible display states
type DisplayState = 'open' | 'compact' | 'hidden' | 'disabled'

// Define the interface for the store state
interface DisplayStoreState {
  headerState: DisplayState
  sidebarLeft: DisplayState
  sidebarRight: DisplayState
  footer: DisplayState
  focusedContainer: 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer' | null // Track the currently focused container
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
    headerFocused: false, // Track first focus for each section
    sidebarLeftFocused: false,
    sidebarRightFocused: false,
    footerFocused: false,
    showIntro: localStorage.getItem('showIntro') === 'false' ? false : true // Initially true to show intro on first load
  }),

  getters: {
    // Getters to check if each element is visible
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
     * @param {'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer'} container - The container to focus ('headerState', 'sidebarLeft', etc.).
     */
    setFocus(container: 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer') {
      this.focusedContainer = container
      // Mark the section as focused by updating the correct focused property
      if (container === 'headerState') {
        this.headerFocused = true
      } else if (container === 'sidebarLeft') {
        this.sidebarLeftFocused = true
      } else if (container === 'sidebarRight') {
        this.sidebarRightFocused = true
      } else if (container === 'footer') {
        this.footerFocused = true
      }
    
      // Set the focused container to 'open' and adjust the others
      this[container] = 'open'
    
      const containers: Array<'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer'> = [
        'headerState', 
        'sidebarLeft', 
        'sidebarRight', 
        'footer'
      ]
    
      // Adjust the states of other containers
      containers.forEach((key) => {
        if (key !== container) {
          if (key === 'footer') {
            this[key] = this[key] !== 'disabled' ? 'hidden' : this[key]
          } else {
            this[key] = this[key] !== 'disabled' ? 'compact' : this[key]
          }
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
     * @param {'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer'} container - The container to change ('headerState', 'sidebarLeft', etc.).
     * @param {DisplayState} state - The new state for the container ('open', 'compact', 'hidden', 'disabled').
     */
    changeState(container: 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer', state: DisplayState) {
      if (['open', 'compact', 'hidden', 'disabled'].includes(state)) {
        this[container] = state
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
