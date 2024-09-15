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
    showIntro: true, // default to true initially
  }),

  actions: {
    loadState() {
      if (typeof window !== 'undefined') {
        this.headerState = (localStorage.getItem('headerState') as DisplayState) || 'open';
        this.sidebarLeft = (localStorage.getItem('sidebarLeft') as DisplayState) || 'hidden';
        this.sidebarRight = (localStorage.getItem('sidebarRight') as DisplayState) || 'hidden';
        this.footer = (localStorage.getItem('footer') as DisplayState) || 'hidden';
        this.showIntro = localStorage.getItem('showIntro') === 'false' ? false : true;
      }
    },

    setFocus(container: 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer') {
      this.focusedContainer = container;
      if (container === 'headerState') this.headerFocused = true;
      if (container === 'sidebarLeft') this.sidebarLeftFocused = true;
      if (container === 'sidebarRight') this.sidebarRightFocused = true;
      if (container === 'footer') this.footerFocused = true;

      this[container] = 'open';
      if (typeof window !== 'undefined') localStorage.setItem(container, 'open');

      const containers: Array<'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer'> = ['headerState', 'sidebarLeft', 'sidebarRight', 'footer'];
      containers.forEach((key) => {
        if (key !== container) {
          const newState = this[key] !== 'disabled' ? (key === 'footer' ? 'hidden' : 'compact') : this[key];
          this[key] = newState;
          if (typeof window !== 'undefined') localStorage.setItem(key, newState);
        }
      });
    },

    clearFocus() {
      this.focusedContainer = null;
      this.resetStates();
    },

    changeState(container: 'headerState' | 'sidebarLeft' | 'sidebarRight' | 'footer', state: DisplayState) {
      if (['open', 'compact', 'hidden', 'disabled'].includes(state)) {
        this[container] = state;
        if (typeof window !== 'undefined') localStorage.setItem(container, state);
      }
    },

    toggleSidebar(sidebar: 'sidebarLeft' | 'sidebarRight') {
      const currentState = this[sidebar];

      // Toggle between 'open', 'compact', and 'hidden' states for sidebars
      if (currentState === 'hidden') {
        this.changeState(sidebar, 'open');
      } else if (currentState === 'open') {
        this.changeState(sidebar, 'compact');
      } else if (currentState === 'compact') {
        this.changeState(sidebar, 'hidden');
      }
    },

    resetStates() {
      this.headerState = 'open';
      this.sidebarLeft = 'hidden';
      this.sidebarRight = 'hidden';
      this.footer = 'hidden';
      this.focusedContainer = null;
      if (typeof window !== 'undefined') {
        localStorage.setItem('headerState', 'open');
        localStorage.setItem('sidebarLeft', 'hidden');
        localStorage.setItem('sidebarRight', 'hidden');
        localStorage.setItem('footer', 'hidden');
      }
    },

    toggleIntroState() {
      this.showIntro = !this.showIntro;
      if (typeof window !== 'undefined') localStorage.setItem('showIntro', JSON.stringify(this.showIntro));
    }
  },
});
