// /stores/displayStore.ts
import { defineStore } from 'pinia'
import { reactive, ref, computed, toRefs, type CSSProperties } from 'vue'
import { useErrorStore } from './errorStore'
import { handleError } from './utils'
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
    showLeft: true,
    showCenter: true,
    showRight: true,
    showExtended: false,
    showCorner: true,
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
    const sizes = { small: 98, medium: 40, large: 35, extraLarge: 30 }
    return (
      sizes[state.viewportSize] *
      (['open', 'compact'].includes(state.sidebarRightState) ? 1 : 0)
    )
  })

  const headerHeight = computed(() => {
    if (state.headerState === 'hidden') return 0
    const sizes = {
      small: state.bigMode ? 10 : 16,
      medium: state.bigMode ? 8 : 12,
      large: state.bigMode ? 7 : 13,
      extraLarge: state.bigMode ? 8 : 14,
    }
    return sizes[state.viewportSize]
  })

  const footerHeights = {
    hidden: {
      small: 1,
      medium: 1,
      large: 1,
      extraLarge: 1,
    },
    compact: {
      small: 25,
      medium: 11,
      large: 17,
      extraLarge: 11,
    },
    open: {
      small: 45,
      medium: 25,
      large: 35,
      extraLarge: 25,
    },
    extended: {
      small: 55,
      medium: 35,
      large: 55,
      extraLarge: 45,
    },
  } as const

  const contentTopOffset = computed(() => {
    const padding = sectionPaddingSize.value
    const headerExists = state.headerState !== 'hidden'
    const header = headerExists ? headerHeight.value : 0
    const paddingTotal = headerExists ? padding * 2 : padding

    return header + paddingTotal
  })

  const footerHeight = computed(() => {
    const stateKey = state.footerState as keyof typeof footerHeights
    const sizeKey = state.viewportSize
    return footerHeights[stateKey]?.[sizeKey] ?? 5
  })

  const sectionPaddingSize = computed(() => {
    const sizes = { small: 0, medium: 0, large: 0, extraLarge: 0 }
    return sizes[state.viewportSize]
  })

  const mainContentHeight = computed(() => {
    const padding = sectionPaddingSize.value
    const headerExists = state.headerState !== 'hidden'
    const header = headerExists ? headerHeight.value : 0

    const footerVisible = state.footerState !== 'hidden'
    const footerPadding = footerVisible ? padding : 0
    const headerPadding = headerExists ? padding : padding * 2

    const totalPadding = padding + headerPadding + footerPadding

    return 100 - (header + totalPadding + footerHeight.value)
  })

  const mainContentWidth = computed(() => {
    return (
      100 -
      (state.sidebarRightState !== 'hidden'
        ? sidebarRightWidth.value + sectionPaddingSize.value * 3
        : sectionPaddingSize.value * 2)
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

  const footerToggleStyle = computed((): CSSProperties => {
    return {
      position: 'fixed',
      top: `calc(100vh - var(--vh) * ${footerHeight.value})`,
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: '50',
    }
  })

  const cornerPanelStyle = computed(() => {
    const paddingVw = sectionPaddingSize.value
    const rightSidebarVisible = ['open', 'compact'].includes(
      state.sidebarRightState,
    )

    // Right offset aligns with main content's right edge in vw
    const rightVw = rightSidebarVisible
      ? sidebarRightWidth.value + paddingVw * 3 // sidebar + main's right gutter
      : paddingVw * 2 // just main's right gutter

    return {
      top: `calc(var(--vh) * ${contentTopOffset.value} )`, // below header in vh units
      right: `${rightVw}vw`,
    } as CSSProperties
  })

  const leftSidebarStyle = computed(() => {
    const header = state.headerState === 'hidden' ? 0 : headerHeight.value
    return state.sidebarLeftState !== 'hidden'
      ? {
          height: `calc(var(--vh) * ${sidebarContentHeight.value})`,
          width: `${sidebarLeftWidth.value}vw`,
          top: `calc(var(--vh) * ${header + sectionPaddingSize.value * 2})`,
          left: `${sectionPaddingSize.value}vw`,
        }
      : { width: '0px', height: '0px' }
  })

  const footerStyle = computed(() => {
    const padding = sectionPaddingSize.value
    const header = state.headerState === 'hidden' ? 0 : headerHeight.value
    const headerPadding = state.headerState === 'hidden' ? padding : padding * 2
    const content = mainContentHeight.value

    return {
      top: `calc(var(--vh) * ${header + content + headerPadding + padding})`,
      left: `${padding}vw`,
      width: `calc(100vw - ${padding * 2}vw)`,
      height: `calc(var(--vh) * ${footerHeight.value})`,
    }
  })

  const rightSidebarStyle = computed(() => {
    const padding = sectionPaddingSize.value
    const visible = ['open', 'compact'].includes(state.sidebarRightState)
    return {
      top: `calc(var(--vh) * ${contentTopOffset.value})`,
      right: `${padding}vw`,
      width: visible ? `${sidebarRightWidth.value}vw` : '0px',
      height: visible
        ? `calc(var(--vh) * ${sidebarContentHeight.value})`
        : '0px',
    }
  })

  const sidebarContentHeight = computed(() => {
    const padding = sectionPaddingSize.value
    const headerExists = state.headerState !== 'hidden'
    const header = headerExists ? headerHeight.value : 0
    const totalPadding = padding * 2 + (headerExists ? padding : padding * 2)

    return 100 - (header + totalPadding)
  })

const centerPanelOffset = computed(() => {
    if (!state.showCorner) return 0
    const sizes = {
      small: 8,
      medium: 6,
      large: 5,
      extraLarge: 4,
    }
    return sizes[state.viewportSize]
  })

  const mainContentStyle = computed(() => {
    const padding = sectionPaddingSize.value
    const offset = centerPanelOffset.value

    return {
      top: `calc(var(--vh) * ${contentTopOffset.value + offset})`,
      left: `${padding}vw`,
      width: `calc(${mainContentWidth.value}vw)`,
      height: `calc(var(--vh) * ${mainContentHeight.value - offset})`,
      minHeight: '10vh',
    }
  })

  const isLargeViewport = computed(() =>
    ['large', 'extraLarge'].includes(state.viewportSize),
  )

  function toggleFullscreen() {
    state.isFullScreen = !state.isFullScreen
    state.fullscreenState = state.isFullScreen ? 'fullscreen' : 'nuxt'
    state.headerState = state.isFullScreen ? 'hidden' : 'open'
    saveState()
  }

  function toggleCorner() {
    state.showCorner = !state.showCorner
  }

  function toggleSidebar(side: 'sidebarLeftState' | 'sidebarRightState') {
    const stateMap = {
      hidden: 'compact',
      compact: 'hidden',
      open: 'hidden',
      disabled: 'hidden',
      extended: 'hidden',
    } as const
    state[side] = stateMap[state[side]]
    saveState()
  }
  function toggleFooter() {
    const order: DisplayState[] = ['compact', 'extended', 'hidden']
    const currentIndex = order.indexOf(state.footerState)
    state.footerState = order[(currentIndex + 1) % order.length]
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

  function toggleSection(section: 'left' | 'center' | 'right') {
    const sectionStateMap = {
      left: state.showLeft,
      center: state.showCenter,
      right: state.showRight,
    }

    const setSectionState = (
      key: 'left' | 'center' | 'right',
      value: boolean,
    ) => {
      if (key === 'left') state.showLeft = value
      else if (key === 'center') state.showCenter = value
      else if (key === 'right') state.showRight = value
    }

    const isCurrentlyOn = sectionStateMap[section]

    if (state.viewportSize === 'small') {
      if (isCurrentlyOn) {
        // Turn it off
        setSectionState(section, false)
      } else {
        // Turn off others, turn this one on
        setSectionState('left', false)
        setSectionState('center', false)
        setSectionState('right', false)
        setSectionState(section, true)
      }
    } else {
      // On larger screens, just toggle the selected one
      setSectionState(section, !isCurrentlyOn)
    }

    saveState()
  }

  function toggleExtended() {
    state.showExtended = !state.showExtended
  }

  function setExtraExpanded(val: boolean) {
    state.showExtended = val
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
    const opening = !state.showTutorial

    state.flipState =
      state.flipState === 'tutorial' || state.flipState === 'toTutorial'
        ? 'toMain'
        : 'toTutorial'

    state.showTutorial = opening
    state.sidebarRightState = opening ? 'open' : 'hidden'
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
        handleError(error, 'Custom width failed')
      } finally {
        resizeTimeout.value = null
      }
    }, 200)
  }

  function removeViewportWatcher() {
    window.removeEventListener('resize', updateViewport)
  }

  function loadState() {
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem('displayStoreState')
      if (saved) Object.assign(state, JSON.parse(saved))
    } catch (error) {
      handleError(error, "Couldn't load state.")
    }
  }
  function saveState() {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('displayStoreState', JSON.stringify(state))
    } catch (error) {
      handleError(error, "couldn't save state.")
    }
  }

  function initialize() {
    if (typeof window === 'undefined' || state.isInitialized) return

    queueMicrotask(() => {
      try {
        loadState()
        setCustomVh() // ← Add this here
        updateViewport()
        window.addEventListener('resize', updateViewport)
        state.isInitialized = true
      } catch (error) {
        handleError(error, 'Task Failed: ')
      }
    })
  }

  return {
    ...toRefs(state),
    toggleCorner,
    toggleSection,
    toggleExtended,
    resizeTimeout,
    sidebarLeftWidth,
    sidebarRightWidth,
    headerHeight,
    footerHeight,
    sectionPaddingSize,
    mainContentHeight,
    mainContentWidth,
    headerStyle,
    cornerPanelStyle,
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
