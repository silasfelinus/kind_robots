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
    headerState: 'open',
    sidebarLeft: 'hidden',
    sidebarRight: 'hidden',
    footer: 'hidden',
    focusedContainer: null,
    headerFocused: false,
    sidebarLeftFocused: false,
    sidebarRightFocused: false,
    footerFocused: false,
    showIntro: true // default to true initially
  }),

  actions: {
    // Load state from localStorage only on the client
    loadState() {
      if (typeof window !== 'undefined') {
        this.headerState = (localStorage.getItem('headerState') as DisplayState) || 'open'
        this.sidebarLeft = (localStorage.getItem('sidebarLeft') as DisplayState) || 'hidden'
        this.sidebarRight = (localStorage.getItem('sidebarRight') as DisplayState) || 'hidden'
        this.footer = (localStorage.getItem('footer') as DisplayState) || 'hidden'
        this.showIntro = localStorage.getItem('showIntro') === 'false' ? false : true
      }
    },

    /**
     * Set focus to a specific container and mark it as focused.
     * The focused container will open, and the other containers will be set to compact or hidden.
     */
    setFocus(container: 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer') {
      this.focusedContainer = container
      if (container === 'headerState') this.headerFocused = true
      if (container === 'sidebarLeft') this.sidebarLeftFocused = true
      if (container === 'sidebarRight') this.sidebarRightFocused = true
      if (container === 'footer') this.footerFocused = true

      this[container] = 'open'
      if (typeof window !== 'undefined') localStorage.setItem(container, 'open')  // Persist the open state

      const containers: Array<'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer'> = ['headerState', 'sidebarLeft', 'sidebarRight', 'footer']
      containers.forEach((key) => {
        if (key !== container) {
          const newState = this[key] !== 'disabled' ? (key === 'footer' ? 'hidden' : 'compact') : this[key]
          this[key] = newState
          if (typeof window !== 'undefined') localStorage.setItem(key, newState)  // Persist the new state
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
        if (typeof window !== 'undefined') localStorage.setItem(container, state)  // Persist the state change
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
      if (typeof window !== 'undefined') {
        localStorage.setItem('headerState', 'open')
        localStorage.setItem('sidebarLeft', 'hidden')
        localStorage.setItem('sidebarRight', 'hidden')
        localStorage.setItem('footer', 'hidden')
      }
    },

    /**
     * Toggle the intro state and save it to localStorage.
     */
    toggleIntroState() {
      this.showIntro = !this.showIntro
      if (typeof window !== 'undefined') localStorage.setItem('showIntro', JSON.stringify(this.showIntro))
    }
  },
})