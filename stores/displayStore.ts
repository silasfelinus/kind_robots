import { defineStore } from 'pinia'

// Define the type for possible display states
type DisplayState = 'open' | 'compact' | 'hidden' | 'disabled'

// Define the interface for the store state
interface DisplayStoreState {
  headerState: DisplayState
  sidebarLeft: DisplayState
  sidebarRight: DisplayState
  bottomDrawer: DisplayState
  focusedContainer: keyof Omit<DisplayStoreState, 'focusedContainer'> | null // Track the currently focused container
}

export const useDisplayStore = defineStore('display', {
  state: (): DisplayStoreState => ({
    headerState: 'open',     // Default states
    sidebarLeft: 'hidden',
    sidebarRight: 'hidden',
    bottomDrawer: 'hidden',
    focusedContainer: null,  // No container focused initially
  }),

  getters: {
    // Getters to check if each element is visible
    isHeaderVisible: (state) => state.headerState !== 'hidden',
    isSidebarLeftVisible: (state) => state.sidebarLeft !== 'hidden',
    isSidebarRightVisible: (state) => state.sidebarRight !== 'hidden',
    isBottomDrawerVisible: (state) => state.bottomDrawer !== 'hidden',
  },

  actions: {
    /**
     * Set focus to a specific container.
     * The focused container will open, and the other containers will be set to compact or hidden.
     * @param {keyof Omit<DisplayStoreState, 'focusedContainer'>} container - The container to focus ('headerState', 'sidebarLeft', etc.).
     */
    setFocus(container: keyof Omit<DisplayStoreState, 'focusedContainer'>) {
      this.focusedContainer = container

      // Set the focused container to open and others to compact or hidden
      this[container] = 'open'

      const containers: Array<keyof Omit<DisplayStoreState, 'focusedContainer'>> = [
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
     * @param {keyof Omit<DisplayStoreState, 'focusedContainer'>} container - The container to change ('headerState', 'sidebarLeft', etc.).
     * @param {DisplayState} state - The new state for the container ('open', 'compact', 'hidden', 'disabled').
     */
    changeState(container: keyof Omit<DisplayStoreState, 'focusedContainer'>, state: DisplayState) {
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
     * Checks if a container is focused.
     * @param {keyof Omit<DisplayStoreState, 'focusedContainer'>} container - The container to check focus on.
     * @returns {boolean} True if the container is focused.
     */
    isFocused(container: keyof Omit<DisplayStoreState, 'focusedContainer'>): boolean {
      return this.focusedContainer === container
    },
  },
})
