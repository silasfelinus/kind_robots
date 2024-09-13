import { defineStore } from 'pinia'
import { useErrorStore, ErrorType } from '@/stores/error'

type DisplayState = 'open' | 'compact' | 'hidden' | 'disabled'

interface DisplayStoreState {
  headerState: DisplayState
  sidebarLeft: DisplayState
  sidebarRight: DisplayState
  bottomDrawer: DisplayState
  focusedContainer: keyof DisplayStoreState | null // Track which container has focus
}

export const useDisplayStore = defineStore('display', {
  state: (): DisplayStoreState => ({
    headerState: 'open',     // Default state
    sidebarLeft: 'open',     // Default state
    sidebarRight: 'hidden',  // Default state
    bottomDrawer: 'hidden',  // Default state
    focusedContainer: null,  // No container is focused initially
  }),

  getters: {
    isHeaderOpen: (state) => state.headerState === 'open',
    isSidebarLeftOpen: (state) => state.sidebarLeft === 'open',
    isSidebarRightOpen: (state) => state.sidebarRight === 'open',
    isBottomDrawerOpen: (state) => state.bottomDrawer === 'open',
  },

  actions: {
    /**
     * Changes the state of the specified container.
     * @param {keyof DisplayStoreState} container - The container to update ('headerState', 'sidebarLeft', etc.).
     * @param {DisplayState} state - The new state for the container ('open', 'compact', 'hidden', 'disabled').
     */
    async changeState(container: keyof DisplayStoreState, state: DisplayState) {
      const errorStore = useErrorStore()

      try {
        if (!['open', 'compact', 'hidden', 'disabled'].includes(state)) {
          throw new Error('Invalid state provided')
        }

        if (!this.$state.hasOwnProperty(container)) {
          throw new Error(`Invalid container: ${container}`)
        }

        this[container] = state
      } catch (error) {
        await errorStore.handleError(
          () => Promise.reject(error), // Simulating async error handling
          ErrorType.INTERACTION_ERROR,
          `Failed to change state for ${container}`
        )
      }
    },

    /**
     * Sets focus to the specified container and updates the states of the other containers.
     * The focused container will be open, while others will be compact or disabled.
     * @param {keyof DisplayStoreState} container - The container to focus ('headerState', 'sidebarLeft', etc.).
     */
    async setFocus(container: keyof DisplayStoreState) {
      const errorStore = useErrorStore()

      try {
        if (!this.$state.hasOwnProperty(container)) {
          throw new Error(`Invalid container: ${container}`)
        }

        // Set focus to the specified container and update the states accordingly
        this.focusedContainer = container
        this[container] = 'open'

        // Make other containers compact or disabled
        for (const key in this.$state) {
          if (key !== container && key !== 'focusedContainer') {
            this[key as keyof DisplayStoreState] = 'compact'
          }
        }
      } catch (error) {
        await errorStore.handleError(
          () => Promise.reject(error),
          ErrorType.INTERACTION_ERROR,
          `Failed to set focus on ${container}`
        )
      }
    },

    /**
     * Resets all containers to their default states.
     */
    async resetStates() {
      const errorStore = useErrorStore()

      try {
        this.headerState = 'open'
        this.sidebarLeft = 'open'
        this.sidebarRight = 'hidden'
        this.bottomDrawer = 'hidden'
        this.focusedContainer = null // Clear focus
      } catch (error) {
        await errorStore.handleError(
          () => Promise.reject(error),
          ErrorType.GENERAL_ERROR,
          'Failed to reset display states'
        )
      }
    },

    /**
     * Switches focus between containers in a simple round-robin style.
     * When focus is called again, it moves to the next container in a pre-defined order.
     */
    async cycleFocus() {
      const errorStore = useErrorStore()

      try {
        const containers: (keyof DisplayStoreState)[] = ['headerState', 'sidebarLeft', 'sidebarRight', 'bottomDrawer']

        // Get the index of the current focused container or start from -1
        let currentIndex = this.focusedContainer ? containers.indexOf(this.focusedContainer) : -1

        // Calculate the next container to focus
        const nextIndex = (currentIndex + 1) % containers.length
        const nextContainer = containers[nextIndex]

        // Set focus to the next container
        await this.setFocus(nextContainer)
      } catch (error) {
        await errorStore.handleError(
          () => Promise.reject(error),
          ErrorType.INTERACTION_ERROR,
          'Failed to cycle focus'
        )
      }
    }
  }
})
