import { defineStore } from 'pinia'

// Define the type for possible display states
type DisplayState = 'open' | 'compact' | 'hidden' | 'disabled'

// Define the interface for the store state
interface DisplayStoreState {
  headerState: DisplayState
  sidebarLeft: DisplayState
  sidebarRight: DisplayState
  bottomDrawer: DisplayState
  focusedContainer: 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'bottomDrawer' | null // Track the currently focused container
  headerFocused: boolean
  sidebarLeftFocused: boolean
  sidebarRightFocused: boolean
  bottomDrawerFocused: boolean
  showIntro: boolean
}

export const useDisplayStore = defineStore('display', {
  state: (): DisplayStoreState => ({
    headerState: 'open',     // Default states
    sidebarLeft: 'hidden',
    sidebarRight: 'hidden',
    bottomDrawer: 'hidden',
    focusedContainer: null,  // No container focused initially
    headerFocused: false, // Track first focus for each section
    sidebarLeftFocused: false,
    sidebarRightFocused: false,
    bottomDrawerFocused: false,
    showIntro: true // Initially true to show intro on first load
  }),

  getters: {
    // Getters to check if each element is visible
    isHeaderVisible: (state) => state.headerState !== 'hidden',
    isSidebarLeftVisible: (state) => state.sidebarLeft !== 'hidden',
    isSidebarRightVisible: (state) => state.sidebarRight !== 'hidden',
    isBottomDrawerVisible: (state) => state.bottomDrawer !== 'hidden',
    allSectionsFocused: (state) => state.headerFocused && state.sidebarLeftFocused && state.sidebarRightFocused && state.bottomDrawerFocused
  },

  actions: {
    setFocus(container: 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'bottomDrawer') {
      this.focusedContainer = container
      // Mark the section as focused by updating the correct focused property
      if (container === 'headerState') {
        this.headerFocused = true
      } else if (container === 'sidebarLeft') {
        this.sidebarLeftFocused = true
      } else if (container === 'sidebarRight') {
        this.sidebarRightFocused = true
      } else if (container === 'bottomDrawer') {
        this.bottomDrawerFocused = true
      }
    
      // Set the focused container to 'open' and adjust the others
      this[container] = 'open'
    
      const containers: Array<'headerState' | 'sidebarLeft' | 'sidebarRight' | 'bottomDrawer'> = [
        'headerState', 
        'sidebarLeft', 
        'sidebarRight', 
        'bottomDrawer'
      ]
    
      // Adjust the states of other containers
      containers.forEach((key) => {
        if (key !== container) {
          if (key === 'bottomDrawer') {
            this[key] = this[key] !== 'disabled' ? 'hidden' : this[key]
          } else {
            this[key] = this[key] !== 'disabled' ? 'compact' : this[key]
          }
        }
      })
    }
    ,

    /**
     * Clears focus and returns all containers to their default states.
     */
    clearFocus() {
      this.focusedContainer = null
      this.resetStates()
    },

    /**
     * Change the state of a specific container to the desired state.
     * @param {'headerState' | 'sidebarLeft' | 'sidebarRight' | 'bottomDrawer'} container - The container to change ('headerState', 'sidebarLeft', etc.).
     * @param {DisplayState} state - The new state for the container ('open', 'compact', 'hidden', 'disabled').
     */
    changeState(container: 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'bottomDrawer', state: DisplayState) {
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
      this.bottomDrawer = 'hidden'
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
