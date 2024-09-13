import { defineStore } from 'pinia'
import { useErrorStore, ErrorType } from '@/stores/error'

type DisplayState = 'open' | 'compact' | 'hidden'

interface DisplayStoreState {
  headerState: DisplayState
  sidebarLeft: DisplayState
  sidebarRight: DisplayState
  bottomDrawer: DisplayState
}

export const useDisplayStore = defineStore('display', {
  state: (): DisplayStoreState => ({
    headerState: 'open',     // Default state
    sidebarLeft: 'open',     // Default state
    sidebarRight: 'hidden',  // Default state
    bottomDrawer: 'hidden',  // Default state
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
     * @param {DisplayState} state - The new state for the container ('open', 'compact', 'hidden').
     */
    async changeState(container: keyof DisplayStoreState, state: DisplayState) {
      const errorStore = useErrorStore()

      try {
        if (!['open', 'compact', 'hidden'].includes(state)) {
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
     * Resets all containers to their default states.
     */
    async resetStates() {
      const errorStore = useErrorStore()
      
      try {
        this.headerState = 'open'
        this.sidebarLeft = 'open'
        this.sidebarRight = 'hidden'
        this.bottomDrawer = 'hidden'
      } catch (error) {
        await errorStore.handleError(
          () => Promise.reject(error),
          ErrorType.GENERAL_ERROR,
          'Failed to reset display states'
        )
      }
    }
  }
})
