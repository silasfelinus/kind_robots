// displayStore.ts
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
    vh: window.innerHeight,  // Store initial vh
    vw: window.innerWidth,   // Store initial vw
  }),

  actions: {
    loadState() {
      if (typeof window !== 'undefined') {
        this.sidebarLeft = (localStorage.getItem('sidebarLeft') as DisplayState) || 'hidden'
        this.showIntro = localStorage.getItem('showIntro') === 'false' ? false : true
      }
    },

    toggleSidebar(side: 'sidebarLeft' | 'sidebarRight') {
      if (this[side] === 'hidden') {
        this[side] = 'open'
      } else {
        this[side] = 'hidden'
      }
      if (typeof window !== 'undefined') localStorage.setItem(side, this[side])
    },

    updateViewport() {
      this.vh = window.innerHeight
      this.vw = window.innerWidth
    },

    toggleIntroState() {
      this.showIntro = !this.showIntro
      if (typeof window !== 'undefined') localStorage.setItem('showIntro', JSON.stringify(this.showIntro))
    }
  },
})
