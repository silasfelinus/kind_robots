import { defineStore } from 'pinia'

// Define the type for possible display states
type DisplayState = 'open' | 'compact' | 'hidden' | 'disabled'

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
  vh: number
  vw: number
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
    showIntro: true,
    vh: 0, // Initialize with a default value that will be updated in onMounted
    vw: 0,
  }),

  actions: {
    // Load the initial state from localStorage
    loadState() {
      if (typeof window !== 'undefined') {
        this.headerState = (localStorage.getItem('headerState') as DisplayState) || 'open'
        this.sidebarLeft = (localStorage.getItem('sidebarLeft') as DisplayState) || 'hidden'
        this.sidebarRight = (localStorage.getItem('sidebarRight') as DisplayState) || 'hidden'
        this.footer = (localStorage.getItem('footer') as DisplayState) || 'hidden'
        this.showIntro = localStorage.getItem('showIntro') === 'false' ? false : true
      }
    },

    // Update the viewport height and width only in client-side runtime
    updateViewport() {
      if (typeof window !== 'undefined') {
        this.vh = window.innerHeight
        this.vw = window.innerWidth
      }
    },

    toggleSidebar(container: 'sidebarLeft' | 'sidebarRight') {
      const currentState = this[container]
      this[container] = currentState === 'hidden' ? 'open' : 'hidden'
      if (typeof window !== 'undefined') {
        localStorage.setItem(container, this[container])
      }
    },

    toggleIntroState() {
      this.showIntro = !this.showIntro
      if (typeof window !== 'undefined') {
        localStorage.setItem('showIntro', JSON.stringify(this.showIntro))
      }
    }
  },
})
