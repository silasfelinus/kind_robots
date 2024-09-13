import { defineStore } from 'pinia'

type DisplayState = 'open' | 'compact' | 'hidden' | 'disabled'

interface DisplayStoreState {
  headerState: DisplayState
  sidebarLeft: DisplayState
  sidebarRight: DisplayState
  bottomDrawer: DisplayState
  focusedContainer: keyof DisplayStoreState | null // Track the currently focused container
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
     * @param {keyof DisplayStoreState} container - The container to focus ('headerState', 'sidebarLeft', etc.).
     */
    setFocus(container: keyof DisplayStoreState) {
      this.focusedContainer = container

      // Set the focused container to open and others to compact or hidden
      this[container] = 'open'

      if (container !== 'headerState') {
        this.headerState = this.headerState !== 'disabled' ? 'compact' : this.headerState
      }

      if (container !== 'sidebarLeft') {
        this.sidebarLeft = this.sidebarLeft !== 'disabled' ? 'compact' : this.sidebarLeft
      }

      if (container !== 'sidebarRight') {
        this.sidebarRight = this.sidebarRight !== 'disabled' ? 'compact' : this.sidebarRight
      }

      if (container !== 'bottomDrawer') {
        this.bottomDrawer = this.bottomDrawer !== 'disabled' ? 'hidden' : this.bottomDrawer
      }
    },

    /**
     * Clears focus and returns all containers to their default states.
     */
    clearFocus() {
      this.focusedContainer = null
    },

    /**
     * Change the state of a specific container to the desired state.
     * @param {keyof DisplayStoreState} container - The container to change ('headerState', 'sidebarLeft', etc.).
     * @param {DisplayState} state - The new state for the container ('open', 'compact', 'hidden', 'disabled').
     */
    changeState(container: keyof DisplayStoreState, state: DisplayState) {
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
     * @param {keyof DisplayStoreState} container - The container to check focus on.
     * @returns {boolean} True if the container is focused.
     */
    isFocused(container: keyof DisplayStoreState): boolean {
      return this.focusedContainer === container
    },
  },
})
