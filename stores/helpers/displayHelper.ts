// /stores/helpers/displayHelper.ts

export function setCustomVh() {
  if (typeof window !== 'undefined') {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }
}

export type SmartState = 'tutorial' | 'teleport'

export type DisplayState =
  | 'open'
  | 'compact'
  | 'hidden'
  | 'disabled'
  | 'extended'
export type FlipState = 'tutorial' | 'main' | 'toTutorial' | 'toMain'
export type FullscreenState = 'nuxt' | 'fullscreen' | 'splash'
export type displayModeState =
  | 'scenario'
  | 'character'
  | 'reward'
  | 'user'
  | 'chat'
  | 'bot'
  | 'pitch'
  | 'art'
  | 'collection'
  | 'dominion'

export type displayActionState =
  | 'gallery'
  | 'card'
  | 'add'
  | 'edit'
  | 'generate'
  | 'interact'

export type EffectId =
  | 'bubble-effect'
  | 'fizzy-bubbles'
  | 'rain-effect'
  | 'butterfly-animation'

export interface DisplayStoreState {
  headerState: DisplayState
  sidebarLeftState: DisplayState
  sidebarRightState: DisplayState
  footerState: DisplayState
  isVertical: boolean
  viewportSize: 'small' | 'medium' | 'large' | 'extraLarge'
  isTouchDevice: boolean
  showTutorial: boolean
  isInitialized: boolean
  flipState: FlipState
  isFullScreen: boolean
  isMobileViewport: boolean
  isAnimating: boolean
  currentAnimation: string
  resizeTimeout: ReturnType<typeof setTimeout> | null
  fullscreenState: FullscreenState
  bigMode: boolean
  displayMode: displayModeState
  displayAction: displayActionState
  previousRoute: string
  mainComponent: string
  headerFlipState: SmartState
}
