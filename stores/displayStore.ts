// /stores/displayStore.ts
import { defineStore } from 'pinia'
import { computed, reactive, ref, toRefs } from 'vue'
import { handleError } from './utils'
import { setCustomVh } from './helpers/displayHelper'
import type {
  DisplayState,
  FlipState,
  displayModeState,
  displayActionState,
  EffectId,
  SmartState,
  FullscreenState,
  NavDock,
} from './helpers/displayHelper'

export type ViewportSize = 'small' | 'medium' | 'large' | 'extraLarge'
type SidebarStateKey = 'sidebarLeftState' | 'sidebarRightState'
type SidebarDirection = 'forward' | 'backward'
type SidebarStage = 'hidden' | 'open'
type HeaderStage = 'open' | 'compact' | 'hidden'

const animationOptions: EffectId[] = [
  'bubble-effect',
  'fizzy-bubbles',
  'rain-effect',
  'butterfly-animation',
]

const displayStates: DisplayState[] = [
  'hidden',
  'compact',
  'open',
  'priority',
  'disabled',
]

const headerStages: HeaderStage[] = ['open', 'compact', 'hidden']
const sidebarStages: SidebarStage[] = ['hidden', 'open']
const smartStates: SmartState[] = ['front', 'dash', 'back']

export const useDisplayStore = defineStore('displayStore', () => {
  const state = reactive({
    headerState: 'open' as DisplayState,
    sidebarLeftState: 'hidden' as DisplayState,
    sidebarRightState: 'hidden' as DisplayState,
    footerState: 'disabled' as DisplayState,
    navDock: 'bottom' as NavDock,

    isVertical: false,
    viewportSize: 'large' as ViewportSize,
    isTouchDevice: false,
    isInitialized: false,
    isMobileViewport: true,

    showTutorial: true,
    flipState: 'tutorial' as FlipState,

    isFullScreen: false,
    fullscreenState: 'nuxt' as FullscreenState,

    isAnimating: false,
    currentAnimation: '' as EffectId | '',

    displayMode: 'scenario' as displayModeState,
    displayAction: 'gallery' as displayActionState,
    previousRoute: '',
    mainComponent: '',

    showLeft: true,
    showCenter: true,
    showRight: true,
    showExtended: false,
    showCorner: true,

    SmartState: 'front' as SmartState,
  })

  const resizeTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
  const viewportFrame = ref<number | null>(null)

  const isLargeViewport = computed(() => {
    return state.viewportSize === 'large' || state.viewportSize === 'extraLarge'
  })

  const sidebarLeftVisible = computed(() => {
    return (
      state.sidebarLeftState !== 'hidden' &&
      state.sidebarLeftState !== 'disabled'
    )
  })

  const sidebarRightVisible = computed(() => {
    return (
      state.sidebarRightState !== 'hidden' &&
      state.sidebarRightState !== 'disabled'
    )
  })

  const headerContentVisible = computed(() => {
    return state.headerState !== 'hidden' && state.headerState !== 'disabled'
  })

  const footerContentVisible = computed(() => {
    return state.footerState !== 'hidden' && state.footerState !== 'disabled'
  })

  const leftSidebarStage = computed<SidebarStage>(() => {
    return normalizeSidebarState(state.sidebarLeftState)
  })

  const rightSidebarStage = computed<SidebarStage>(() => {
    return normalizeSidebarState(state.sidebarRightState)
  })

  const headerModeLabel = computed(() => state.headerState)
  const footerModeLabel = computed(() => state.footerState)
  const leftSidebarModeLabel = computed(() => leftSidebarStage.value)
  const rightSidebarModeLabel = computed(() => rightSidebarStage.value)

  const showCornerPanel = computed(() => {
    return state.showCorner && rightSidebarStage.value === 'open'
  })

  function normalizeDisplayState(
    value: unknown,
    fallback: DisplayState,
  ): DisplayState {
    return displayStates.includes(value as DisplayState)
      ? (value as DisplayState)
      : fallback
  }

  function normalizeSidebarState(value: unknown): SidebarStage {
    return value === 'open' || value === 'compact' || value === 'priority'
      ? 'open'
      : 'hidden'
  }

  function normalizeSmartState(value: unknown): SmartState {
    return smartStates.includes(value as SmartState)
      ? (value as SmartState)
      : 'front'
  }

  function normalizeNavDock(value: unknown): NavDock {
    return value === 'top' ? 'top' : 'bottom'
  }

  function getSavedDisplayState() {
    return {
      headerState: state.headerState,
      sidebarLeftState: state.sidebarLeftState,
      sidebarRightState: state.sidebarRightState,
      footerState: state.footerState,
      navDock: state.navDock,
      showTutorial: state.showTutorial,
      flipState: state.flipState,
      isFullScreen: state.isFullScreen,
      fullscreenState: state.fullscreenState,
      displayMode: state.displayMode,
      displayAction: state.displayAction,
      previousRoute: state.previousRoute,
      mainComponent: state.mainComponent,
      showLeft: state.showLeft,
      showCenter: state.showCenter,
      showRight: state.showRight,
      showExtended: state.showExtended,
      showCorner: state.showCorner,
      SmartState: state.SmartState,
    }
  }

  function loadState() {
    if (typeof window === 'undefined') return

    try {
      const saved = window.localStorage.getItem('displayStoreState')
      if (!saved) return

      const parsed = JSON.parse(saved) as Partial<typeof state>

      state.headerState = normalizeDisplayState(parsed.headerState, 'open')
      state.sidebarLeftState = normalizeSidebarState(parsed.sidebarLeftState)
      state.sidebarRightState = normalizeSidebarState(parsed.sidebarRightState)
      state.footerState = normalizeDisplayState(parsed.footerState, 'disabled')
      state.navDock = normalizeNavDock(parsed.navDock)

      if (typeof parsed.showTutorial === 'boolean') {
        state.showTutorial = parsed.showTutorial
      }

      if (parsed.flipState) {
        state.flipState = parsed.flipState
      }

      if (typeof parsed.isFullScreen === 'boolean') {
        state.isFullScreen = parsed.isFullScreen
      }

      if (parsed.fullscreenState) {
        state.fullscreenState = parsed.fullscreenState
      }

      if (parsed.displayMode) {
        state.displayMode = parsed.displayMode
      }

      if (parsed.displayAction) {
        state.displayAction = parsed.displayAction
      }

      if (typeof parsed.previousRoute === 'string') {
        state.previousRoute = parsed.previousRoute
      }

      if (typeof parsed.mainComponent === 'string') {
        state.mainComponent = parsed.mainComponent
      }

      if (typeof parsed.showLeft === 'boolean') {
        state.showLeft = parsed.showLeft
      }

      if (typeof parsed.showCenter === 'boolean') {
        state.showCenter = parsed.showCenter
      }

      if (typeof parsed.showRight === 'boolean') {
        state.showRight = parsed.showRight
      }

      if (typeof parsed.showExtended === 'boolean') {
        state.showExtended = parsed.showExtended
      }

      if (typeof parsed.showCorner === 'boolean') {
        state.showCorner = parsed.showCorner
      }

      state.SmartState = normalizeSmartState(parsed.SmartState)
      state.isAnimating = false
      state.currentAnimation = ''
    } catch (error) {
      window.localStorage.removeItem('displayStoreState')
      handleError(error, "Couldn't load display state.")
    }
  }

  function saveState() {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(
        'displayStoreState',
        JSON.stringify(getSavedDisplayState()),
      )
    } catch (error) {
      handleError(error, "Couldn't save display state.")
    }
  }

  function applyViewportSize() {
    if (typeof window === 'undefined') return

    try {
      setCustomVh()

      const width = window.innerWidth

      state.isVertical = window.innerHeight > window.innerWidth
      state.isTouchDevice =
        'ontouchstart' in window || navigator.maxTouchPoints > 0

      if (width < 768) {
        state.viewportSize = 'small'
        state.isMobileViewport = true
        return
      }

      if (width < 1024) {
        state.viewportSize = 'medium'
        state.isMobileViewport = false
        return
      }

      if (width < 1440) {
        state.viewportSize = 'large'
        state.isMobileViewport = false
        return
      }

      state.viewportSize = 'extraLarge'
      state.isMobileViewport = false
    } catch (error) {
      handleError(error, 'Viewport update failed.')
    }
  }

  function updateViewport() {
    if (typeof window === 'undefined') return

    if (viewportFrame.value !== null) {
      cancelAnimationFrame(viewportFrame.value)
    }

    viewportFrame.value = requestAnimationFrame(() => {
      applyViewportSize()
      viewportFrame.value = null
    })
  }

  function initialize() {
    if (typeof window === 'undefined' || state.isInitialized) return

    state.isInitialized = true

    try {
      loadState()
      applyViewportSize()

      window.addEventListener('resize', updateViewport, { passive: true })
      window.addEventListener('orientationchange', updateViewport, {
        passive: true,
      })
      window.visualViewport?.addEventListener('resize', updateViewport, {
        passive: true,
      })
    } catch (error) {
      state.isInitialized = false
      handleError(error, 'Display store initialization failed.')
    }
  }

  function removeViewportWatcher() {
    if (typeof window === 'undefined') return

    if (resizeTimeout.value) {
      clearTimeout(resizeTimeout.value)
      resizeTimeout.value = null
    }

    if (viewportFrame.value !== null) {
      cancelAnimationFrame(viewportFrame.value)
      viewportFrame.value = null
    }

    window.removeEventListener('resize', updateViewport)
    window.removeEventListener('orientationchange', updateViewport)
    window.visualViewport?.removeEventListener('resize', updateViewport)
  }

  function setHeaderState(next: DisplayState) {
    state.headerState = normalizeDisplayState(next, 'open')
    saveState()
  }

  function toggleHeader(mode: 'cycle' | HeaderStage = 'cycle') {
    if (mode !== 'cycle') {
      state.headerState = mode
      saveState()
      return
    }

    const currentIndex = headerStages.indexOf(state.headerState as HeaderStage)
    const safeIndex = currentIndex === -1 ? 0 : currentIndex
    state.headerState =
      headerStages[(safeIndex + 1) % headerStages.length] ?? 'open'
    saveState()
  }

  function setFooterState(next: DisplayState) {
    state.footerState = normalizeDisplayState(next, 'disabled')
    saveState()
  }

  function toggleFooter() {
    state.footerState = state.footerState === 'disabled' ? 'open' : 'disabled'
    saveState()
  }

  function getSidebarStage(side: 'left' | 'right'): SidebarStage {
    return side === 'left' ? leftSidebarStage.value : rightSidebarStage.value
  }

  function setSidebarStage(side: 'left' | 'right', stage: SidebarStage) {
    if (side === 'left') {
      state.sidebarLeftState = stage
    } else {
      state.sidebarRightState = stage
    }

    saveState()
  }

  function getNextSidebarStage(
    current: SidebarStage,
    direction: SidebarDirection,
  ): SidebarStage {
    const index = sidebarStages.indexOf(current)

    if (direction === 'backward') {
      return (
        sidebarStages[
          (index - 1 + sidebarStages.length) % sidebarStages.length
        ] ?? 'hidden'
      )
    }

    return sidebarStages[(index + 1) % sidebarStages.length] ?? 'hidden'
  }

  function toggleSidebar(
    side: SidebarStateKey,
    direction: SidebarDirection = 'forward',
  ) {
    const logicalSide = side === 'sidebarLeftState' ? 'left' : 'right'
    const current = getSidebarStage(logicalSide)
    const next = getNextSidebarStage(current, direction)

    setSidebarStage(logicalSide, next)
  }

  function toggleLeftSidebar(direction: SidebarDirection = 'forward') {
    toggleSidebar('sidebarLeftState', direction)
  }

  function toggleRightSidebar(direction: SidebarDirection = 'forward') {
    toggleSidebar('sidebarRightState', direction)
  }

  function setSidebarRight(isOpen: boolean) {
    state.sidebarRightState = isOpen ? 'open' : 'hidden'
    saveState()
  }

  function toggleFullscreen() {
    state.isFullScreen = !state.isFullScreen
    state.fullscreenState = state.isFullScreen ? 'fullscreen' : 'nuxt'
    saveState()
  }

  function toggleCorner() {
    state.showCorner = !state.showCorner
    saveState()
  }

  function setNavDock(next: NavDock) {
    state.navDock = normalizeNavDock(next)
    saveState()
  }

  function setMainComponent(name: string) {
    state.mainComponent = name
    saveState()
  }

  function setPreviousRoute(path: string) {
    state.previousRoute = path
    saveState()
  }

  function setAction(action: displayActionState) {
    state.displayAction = action
    saveState()
  }

  function setMode(mode: displayModeState) {
    state.displayMode = mode
    saveState()
  }

  function toggleTutorial() {
    const opening = !state.showTutorial

    state.flipState =
      state.flipState === 'tutorial' || state.flipState === 'toTutorial'
        ? 'toMain'
        : 'toTutorial'

    state.showTutorial = opening
    state.sidebarRightState = opening ? 'open' : 'hidden'
    saveState()
  }

  function toggleSection(section: 'left' | 'center' | 'right') {
    if (section === 'left') {
      state.showLeft = !state.showLeft
    }

    if (section === 'center') {
      state.showCenter = !state.showCenter
    }

    if (section === 'right') {
      state.showRight = !state.showRight
    }

    saveState()
  }

  function toggleExtended() {
    state.showExtended = !state.showExtended
    saveState()
  }

  function setExtraExpanded(value: boolean) {
    state.showExtended = value
    saveState()
  }

  function toggleRandomAnimation() {
    const index = Math.floor(Math.random() * animationOptions.length)
    state.currentAnimation = animationOptions[index] ?? 'bubble-effect'
    state.isAnimating = true
    saveState()
  }

  function toggleAnimationById(id: EffectId) {
    state.currentAnimation = id
    state.isAnimating = true
    saveState()
  }

  function stopAnimation() {
    state.isAnimating = false
    state.currentAnimation = ''
    saveState()
  }

  function setSmartState(next: SmartState) {
    state.SmartState = normalizeSmartState(next)
    saveState()
  }

  function toggleSmartFlip() {
    const index = smartStates.indexOf(state.SmartState)
    const safeIndex = index === -1 ? 0 : index
    state.SmartState =
      smartStates[(safeIndex + 1) % smartStates.length] ?? 'front'
    saveState()
  }

  function changeState(
    section:
      | 'sidebarLeftState'
      | 'sidebarRightState'
      | 'headerState'
      | 'footerState',
    newState: DisplayState,
  ) {
    if (section === 'sidebarLeftState') {
      state.sidebarLeftState = normalizeSidebarState(newState)
      saveState()
      return
    }

    if (section === 'sidebarRightState') {
      state.sidebarRightState = normalizeSidebarState(newState)
      saveState()
      return
    }

    if (section === 'headerState') {
      setHeaderState(newState)
      return
    }

    setFooterState(newState)
  }

  return {
    ...toRefs(state),
    resizeTimeout,
    viewportFrame,

    isLargeViewport,
    sidebarLeftVisible,
    sidebarRightVisible,
    headerContentVisible,
    footerContentVisible,
    leftSidebarStage,
    rightSidebarStage,
    headerModeLabel,
    footerModeLabel,
    leftSidebarModeLabel,
    rightSidebarModeLabel,
    showCornerPanel,

    initialize,
    removeViewportWatcher,
    applyViewportSize,
    updateViewport,
    saveState,
    loadState,

    setHeaderState,
    toggleHeader,
    setFooterState,
    toggleFooter,
    getSidebarStage,
    setSidebarStage,
    toggleSidebar,
    toggleLeftSidebar,
    toggleRightSidebar,
    setSidebarRight,
    toggleFullscreen,
    toggleCorner,
    setNavDock,
    setMainComponent,
    setPreviousRoute,
    setAction,
    setMode,
    toggleTutorial,
    toggleSection,
    toggleExtended,
    setExtraExpanded,
    toggleRandomAnimation,
    toggleAnimationById,
    stopAnimation,
    setSmartState,
    toggleSmartFlip,
    changeState,
  }
})

export type { EffectId, displayModeState, displayActionState, SmartState }
