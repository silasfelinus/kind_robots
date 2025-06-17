// /stores/displayStore.ts
import { defineStore } from 'pinia'
import { reactive, ref, computed, toRefs } from 'vue'
import { useErrorStore } from './errorStore'
import type {
  DisplayState,
  FlipState,
  displayModeState,
  displayActionState,
  EffectId,
} from './helpers/displayHelper'
import { setCustomVh } from './helpers/displayHelper'

export const useDisplayStore = defineStore('displayStore', () => {
  const state = reactive({
    headerState: 'open' as DisplayState,
    sidebarLeftState: 'compact' as DisplayState,
    sidebarRightState: 'hidden' as DisplayState,
    footerState: 'hidden' as DisplayState,
    isVertical: false,
    viewportSize: 'large' as 'small' | 'medium' | 'large' | 'extraLarge',
    isTouchDevice: false,
    showTutorial: true,
    isInitialized: false,
    flipState: 'tutorial' as FlipState,
    isFullScreen: false,
    isMobileViewport: true,
    isAnimating: false,
    currentAnimation: '',
    fullscreenState: 'nuxt' as 'nuxt' | 'fullscreen',
    bigMode: false,
    displayMode: 'scenario' as displayModeState,
    displayAction: 'gallery' as displayActionState,
    previousRoute: '',
    mainComponent: '',
    isExtraExpanded: false,
  })

  const resizeTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

  const sidebarLeftWidth = computed(() => {
    const sizes = { small: 16, medium: 11, large: 9, extraLarge: 5 }
    return (
      sizes[state.viewportSize] *
      (['open', 'compact'].includes(state.sidebarLeftState) ? 1 : 0)
    )
  })

  const sidebarRightWidth = computed(() => {
    const sizes = { small: 2, medium: 40, large: 25, extraLarge: 28 }
    return (
      sizes[state.viewportSize] *
      (['open', 'compact'].includes(state.sidebarRightState) ? 1 : 0)
    )
  })

  const headerHeight = computed(() => {
    const sizes = {
      small: state.bigMode ? 10 : 16,
      medium: state.bigMode ? 8 : 12,
      large: state.bigMode ? 7 : 13,
      extraLarge: state.bigMode ? 8 : 14,
    }
    return sizes[state.viewportSize]
  })

  const footerHeight = computed(() => {
    const sizes = { small: 8, medium: 6, large: 7, extraLarge: 6 }
    return sizes[state.viewportSize] * (state.footerState === 'open' ? 1 : 0)
  })

  const sectionPaddingSize = computed(() => {
    const sizes = { small: 1, medium: 1, large: 1, extraLarge: 0.5 }
    return sizes[state.viewportSize]
  })

  const mainContentHeight = computed(() => {
    const header = state.headerState === 'hidden' ? 0 : headerHeight.value
    return 100 - (header + 2 * sectionPaddingSize.value)
  })

  const mainContentWidth = computed(() => {
    return (
      100 -
      (state.sidebarRightState !== 'hidden'
        ? sidebarRightWidth.value + sectionPaddingSize.value * 2
        : sectionPaddingSize.value)
    )
  })

  const headerStyle = computed(() => {
    if (state.headerState === 'hidden') return { display: 'none' }
    return {
      height: `calc(var(--vh) * ${headerHeight.value})`,
      width: `calc(100vw - ${sectionPaddingSize.value * 2}vw)`,
      top: `calc(var(--vh) * ${sectionPaddingSize.value})`,
      left: `${sectionPaddingSize.value}vw`,
    }
  })

  const leftToggleStyle = computed(() => {
    const header = state.headerState === 'hidden' ? 0 : headerHeight.value
    return {
      top: `calc(var(--vh) * ${header + sectionPaddingSize.value * 2})`,
      left: `${sectionPaddingSize.value}vw`,
    }
  })

  const rightToggleStyle = computed(() => {
    const header = state.headerState === 'hidden' ? 0 : headerHeight.value
    return {
      top: `calc(var(--vh) * ${header + sectionPaddingSize.value * 2})`,
      right: `${sectionPaddingSize.value}vw`,
    }
  })

  const footerToggleStyle = computed(() => ({
    bottom: `4vh`,
    left: '50%',
    transform: 'translateX(-50%)',
  }))

  const leftSidebarStyle = computed(() => {
    const header = state.headerState === 'hidden' ? 0 : headerHeight.value
    return state.sidebarLeftState !== 'hidden'
      ? {
          height: `calc(var(--vh) * ${mainContentHeight.value})`,
          width: `${sidebarLeftWidth.value}vw`,
          top: `calc(var(--vh) * ${header + sectionPaddingSize.value * 2})`,
          left: `${sectionPaddingSize.value}vw`,
        }
      : { width: '0px', height: '0px' }
  })

  const rightSidebarStyle = computed(() => {
    const header = state.headerState === 'hidden' ? 0 : headerHeight.value
    return state.sidebarRightState !== 'hidden'
      ? {
          height: `calc(var(--vh) * ${mainContentHeight.value})`,
          width: `${sidebarRightWidth.value}vw`,
          top: `calc(var(--vh) * ${header + sectionPaddingSize.value * 2})`,
          right: `${sectionPaddingSize.value}vw`,
        }
      : { width: '0px', height: '0px' }
  })

  const mainContentStyle = computed(() => {
    const header = state.headerState === 'hidden' ? 0 : headerHeight.value
    return {
      minHeight: `calc(var(--vh) * ${mainContentHeight.value})`,
      maxHeight: '100%',
      width: `calc(${mainContentWidth.value}vw)`,
      top: `calc(var(--vh) * ${header + sectionPaddingSize.value * 2})`,
      right:
        state.sidebarRightState !== 'hidden'
          ? `calc(${sidebarRightWidth.value}vw + ${sectionPaddingSize.value * 2}vw)`
          : `${sectionPaddingSize.value}vw`,
      left: `${sectionPaddingSize.value}vw`,
    }
  })

  const footerStyle = computed(() => ({ height: '0px', width: '0px' }))

  const isLargeViewport = computed(() =>
    ['large', 'extraLarge'].includes(state.viewportSize),
  )

  function toggleFullscreen() {
    state.isFullScreen = !state.isFullScreen
    state.fullscreenState = state.isFullScreen ? 'fullscreen' : 'nuxt'
    state.headerState = state.isFullScreen ? 'hidden' : 'open'
    saveState()
  }

  function toggleSidebar(side: 'sidebarLeftState' | 'sidebarRightState') {
    const stateMap = {
      hidden: 'compact',
      compact: 'hidden',
      open: 'hidden',
      disabled: 'hidden',
    } as const
    state[side] = stateMap[state[side]]
    saveState()
  }

  function toggleFooter() {
    state.footerState = state.footerState === 'open' ? 'hidden' : 'open'
  }

  function toggleBigMode() {
    state.bigMode = !state.bigMode
  }

  function setMainComponent(name: string) {
    state.mainComponent = name
  }

  function toggleRandomAnimation() {
    const options = [
      'bubble-effect',
      'fizzy-bubbles',
      'rain-effect',
      'butterfly-animation',
    ]
    state.currentAnimation = options[Math.floor(Math.random() * options.length)]
    state.isAnimating = true
  }

  function stopAnimation() {
    state.isAnimating = false
    state.currentAnimation = ''
  }

  function toggleExtraExpanded() {
    state.isExtraExpanded = !state.isExtraExpanded
  }

  function setExtraExpanded(val: boolean) {
    state.isExtraExpanded = val
  }

  function setSidebarRight(isOpen: boolean) {
    state.sidebarRightState = isOpen ? 'open' : 'hidden'
    saveState()
  }

  function toggleAnimationById(id: EffectId) {
    state.currentAnimation = id
    state.isAnimating = true
  }

  function changeState(
    section:
      | 'sidebarLeftState'
      | 'sidebarRightState'
      | 'headerState'
      | 'footerState',
    newState: DisplayState,
  ) {
    state[section] = newState
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
    state.flipState =
      state.flipState === 'tutorial' || state.flipState === 'toTutorial'
        ? 'toMain'
        : 'toTutorial'
    state.showTutorial = !state.showTutorial
    saveState()
  }

  function updateViewport() {
    if (resizeTimeout.value) clearTimeout(resizeTimeout.value)
    resizeTimeout.value = setTimeout(() => {
      try {
        setCustomVh()
        const width = window.innerWidth
        state.isVertical = window.innerHeight > window.innerWidth
        state.isTouchDevice =
          'ontouchstart' in window || navigator.maxTouchPoints > 0

        if (width < 768) {
          state.viewportSize = 'small'
          state.isMobileViewport = true
        } else if (width < 1024) {
          state.viewportSize = 'medium'
          state.isMobileViewport = false
        } else if (width < 1440) {
          state.viewportSize = 'large'
          state.isMobileViewport = false
        } else {
          state.viewportSize = 'extraLarge'
          state.isMobileViewport = false
        }
      } catch (error) {
        handleError(error)
      } finally {
        resizeTimeout.value = null
      }
    }, 200)
  }

  function removeViewportWatcher() {
    window.removeEventListener('resize', updateViewport)
  }

  function saveState() {
    try {
      localStorage.setItem('displayStoreState', JSON.stringify(state))
    } catch (error) {
      handleError(error)
    }
  }

  function loadState() {
    try {
      const saved = localStorage.getItem('displayStoreState')
      if (saved) Object.assign(state, JSON.parse(saved))
    } catch (error) {
      handleError(error)
    }
  }

  function initialize() {
    if (state.isInitialized) return
    try {
      loadState()
      updateViewport()
      window.addEventListener('resize', updateViewport)
      state.isInitialized = true
    } catch (error) {
      handleError(error)
    }
  }

  function handleError(error: unknown) {
    useErrorStore().setError(ErrorType.GENERAL_ERROR, error)
  }

  return {
    ...toRefs(state),
    resizeTimeout,
    sidebarLeftWidth,
    sidebarRightWidth,
    headerHeight,
    footerHeight,
    sectionPaddingSize,
    mainContentHeight,
    mainContentWidth,
    headerStyle,
    leftToggleStyle,
    rightToggleStyle,
    footerToggleStyle,
    leftSidebarStyle,
    rightSidebarStyle,
    mainContentStyle,
    footerStyle,
    isLargeViewport,
    toggleFullscreen,
    toggleSidebar,
    toggleFooter,
    toggleBigMode,
    setMainComponent,
    toggleRandomAnimation,
    stopAnimation,
    toggleExtraExpanded,
    setExtraExpanded,
    toggleAnimationById,
    changeState,
    setAction,
    setMode,
    toggleTutorial,
    setSidebarRight,
    saveState,
    loadState,
    updateViewport,
    initialize,
    removeViewportWatcher,
  }
})

export type { EffectId, displayModeState, displayActionState }
