// src/stores/toggleStore.ts
import { defineStore } from 'pinia'

// Define the screen states
export enum ScreenState {
  FULL = 'full',
  HALF = 'half',
  ICON = 'icon',
  LIST = 'list',
  WINDOW = 'window',
  COMPACT = 'compact',
  POPUP = 'popup',
}

// Define the toggleable screens
export enum ToggleableScreens {
  USER_DASHBOARD = 'user-dashboard',
  CHAT_WINDOW = 'chat-window',
  MAIN_SLOT = 'main-slot',
  ART_SCREEN = 'art-screen',
  NAV_SCREEN = 'nav-screen',
  USER_SETTINGS = 'user-settings',
  USER_FEED = 'user-feed',
  USER_TOGGLES = 'user-toggles',
}
export const useToggleStore = defineStore({
  id: 'toggleStore',
  state: () => ({
    screenStates: {} as Record<ToggleableScreens, ScreenState>,
  }),
  actions: {
    setScreenState(screen: ToggleableScreens, state: ScreenState) {
      this.screenStates[screen] = state
    },
    toggleScreenState(screen: ToggleableScreens) {
      this.screenStates[screen] =
        this.screenStates[screen] === ScreenState.FULL
          ? ScreenState.HALF
          : ScreenState.FULL
    },
    getScreenState(screen: ToggleableScreens) {
      return this.screenStates[screen] || ScreenState.FULL // Default to FULL if not set
    },
    loadFromLocalStorage() {
      if (typeof window !== 'undefined') {
        const savedState = localStorage.getItem('toggleStore')
        if (savedState) {
          this.$patch(JSON.parse(savedState))
        }
      }
    },
  },
})
