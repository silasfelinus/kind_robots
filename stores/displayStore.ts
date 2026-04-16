// /stores/displayStore.ts
import { defineStore } from 'pinia'
import { reactive, ref, computed, toRefs, type CSSProperties } from 'vue'
import { handleError } from './utils'
import type {
  DisplayState,
  FlipState,
  displayModeState,
  displayActionState,
  EffectId,
  SmartState,
} from './helpers/displayHelper'
import { setCustomVh } from './helpers/displayHelper'

export const useDisplayStore = defineStore('displayStore', () => {
  const state = reactive({
    headerState: 'open' as DisplayState,
    sidebarLeftState: 'compact' as DisplayState,
    sidebarRightState: 'hidden' as DisplayState,
    footerState: 'hidden' as DisplayState,

    leftHeaderPriority: true,
    rightHeaderPriority: true,
    leftFooterPriority: false,
    rightFooterPriority: false,

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
    SmartState: 'front' as SmartState,
  })

  const resizeTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

  const sidebarLeftVisible = computed(() =>
    ['open', 'compact'].includes(state.sidebarLeftState),
  )

  const sidebarRightVisible = computed(() =>
    ['open', 'compact'].includes(state.sidebarRightState),
  )

  const sidebarLeftWidth = computed(() => {
    const sizes = { small: 16, medium: 11, large: 9, extraLarge: 5 }
    return sizes[state.viewportSize] * (sidebarLeftVisible.value ? 1 : 0)
  })

  const sidebarRightWidth = computed(() => {
    const sizes = { small: 98, medium: 40, large: 35, extraLarge: 30 }
    return sizes[state.viewportSize] * (sidebarRightVisible.value ? 1 : 0)
  })

  const headerHeight = computed(() => {
    if (state.headerState === 'hidden') return 0
    const sizes = {
      small: state.bigMode ? 6 : 14,
      medium: state.bigMode ? 12 : 13,
      large: state.bigMode ? 10 : 12,
      extraLarge: state.bigMode ? 8 : 13,
    }
    return sizes[state.viewportSize]
  })

  const footerHeights = {
    hidden: { small: 0, medium: 0, large: 0, extraLarge: 0 },
    compact: { small: 25, medium: 11, large: 17, extraLarge: 11 },
    open: { small: 45, medium: 25, large: 35, extraLarge: 25 },
    extended: { small: 55, medium: 35, large: 55, extraLarge: 45 },
  } as const

  const sectionPaddingSize = computed(() => {
    const sizes = { small: 0, medium: 0, large: 0, extraLarge: 0 }
    return sizes[state.viewportSize]
  })

  const footerVisible = computed(() => state.footerState !== 'hidden')

  const footerHeight = computed(() => {
    const stateKey = state.footerState as keyof typeof footerHeights
    const sizeKey = state.viewportSize
    return footerHeights[stateKey]?.[sizeKey] ?? 5
  })

  const contentTopOffset = computed(() => {
    const padding = sectionPaddingSize.value
    const headerExists = state.headerState !== 'hidden'
    const header = headerExists ? headerHeight.value : 0
    const paddingTotal = headerExists ? padding * 2 : padding
    return header + paddingTotal
  })

  const contentBottomOffset = computed(() => {
    const padding = sectionPaddingSize.value
    const footer = footerVisible.value ? footerHeight.value : 0
    const paddingTotal = footerVisible.value ? padding : 0
    return footer + paddingTotal
  })

  const sidebarContentHeight = computed(() => {
    const padding = sectionPaddingSize.value
    const headerExists = state.headerState !== 'hidden'
    const header = headerExists ? headerHeight.value : 0
    const headerPadding = headerExists ? padding * 2 : padding
    const footerPad = footerVisible.value ? padding : 0

    return (
      100 - (header + headerPadding + contentBottomOffset.value + footerPad)
    )
  })

  const mainContentHeight = computed(() => {
    const padding = sectionPaddingSize.value
    const headerExists = state.headerState !== 'hidden'
    const header = headerExists ? headerHeight.value : 0
    const footerPadding = footerVisible.value ? padding : 0
    const totalPadding = padding * 2 + footerPadding
    return 100 - (header + totalPadding + footerHeight.value)
  })

  const mainContentLeft = computed(() => {
    return sectionPaddingSize.value + sidebarLeftWidth.value
  })

  const mainContentRightInset = computed(() => {
    return sectionPaddingSize.value + sidebarRightWidth.value
  })

  const mainContentWidth = computed(() => {
    return 100 - mainContentLeft.value - mainContentRightInset.value
  })

  const headerLeftInset = computed(() => {
    const padding = sectionPaddingSize.value
    if (!state.leftHeaderPriority || !sidebarLeftVisible.value) return padding
    return padding + sidebarLeftWidth.value
  })

  const headerRightInset = computed(() => {
    const padding = sectionPaddingSize.value
    if (!state.rightHeaderPriority || !sidebarRightVisible.value) return padding
    return padding + sidebarRightWidth.value
  })

  const headerWidth = computed(() => {
    return 100 - headerLeftInset.value - headerRightInset.value
  })

  const footerLeftInset = computed(() => {
    const padding = sectionPaddingSize.value
    if (!state.leftFooterPriority || !sidebarLeftVisible.value) return padding
    return padding + sidebarLeftWidth.value
  })

  const footerRightInset = computed(() => {
    const padding = sectionPaddingSize.value
    if (!state.rightFooterPriority || !sidebarRightVisible.value) return padding
    return padding + sidebarRightWidth.value
  })

  const footerWidth = computed(() => {
    return 100 - footerLeftInset.value - footerRightInset.value
  })

  const leftToggleStyle = computed(() => {
    const header = state.headerState === 'hidden' ? 0 : headerHeight.value
    return {
      top: `calc(var(--vh) * ${header + sectionPaddingSize.value * 2})`,
      left: `${sectionPaddingSize.value}vw`,
      zIndex: '70',
    }
  })

  const rightToggleStyle = computed(() => {
    const header = state.headerState === 'hidden' ? 0 : headerHeight.value
    return {
      top: `calc(var(--vh) * ${header + sectionPaddingSize.value * 2})`,
      right: `${sectionPaddingSize.value}vw`,
      zIndex: '70',
    }
  })

  const footerToggleStyle = computed(
    (): CSSProperties => ({
      position: 'fixed',
      left: '50%',
      bottom: `calc(var(--vh) * ${Math.max(1, footerHeight.value * 0.25)})`,
      transform: 'translateX(-50%)',
      zIndex: '80',
    }),
  )

  const headerToggleStyle = computed(
    (): CSSProperties => ({
      position: 'fixed',
      top: `calc(var(--vh) * ${Math.max(0.5, sectionPaddingSize.value + 0.75)})`,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '80',
    }),
  )

  const cornerPanelStyle = computed(() => {
    const paddingVw = sectionPaddingSize.value
    const rightInset = sidebarRightVisible.value
      ? sidebarRightWidth.value + paddingVw
      : paddingVw

    return {
      top: `calc(var(--vh) * ${contentTopOffset.value})`,
      right: `${rightInset}vw`,
    } as CSSProperties
  })

  const cornerToggleStyle = computed(
    (): CSSProperties => ({
      position: 'absolute',
      top: '0.75rem',
      right: '0.75rem',
      zIndex: '60',
    }),
  )

  const leftSidebarStyle = computed(() => {
    const header = state.headerState === 'hidden' ? 0 : headerHeight.value

    return sidebarLeftVisible.value
      ? {
          height: `calc(var(--vh) * ${sidebarContentHeight.value})`,
          width: `${sidebarLeftWidth.value}vw`,
          top: `calc(var(--vh) * ${header + sectionPaddingSize.value * 2})`,
          left: `${sectionPaddingSize.value}vw`,
        }
      : {
          top: `calc(var(--vh) * ${header + sectionPaddingSize.value * 2})`,
          left: `${sectionPaddingSize.value}vw`,
          width: '0px',
          height: '0px',
        }
  })

  const rightSidebarStyle = computed(() => {
    const padding = sectionPaddingSize.value

    if (!sidebarRightVisible.value) {
      return {
        top: `calc(var(--vh) * ${contentTopOffset.value})`,
        right: `${padding}vw`,
        width: '0px',
        height: '0px',
      }
    }

    if (state.bigMode) {
      return {
        top: `calc(var(--vh) * ${contentTopOffset.value})`,
        right: `${padding}vw`,
        width: `${sidebarRightWidth.value}vw`,
        height: `calc(var(--vh) * ${sidebarContentHeight.value})`,
      }
    }

    const footerPad = footerVisible.value ? padding : 0
    const fullHeight =
      100 - (padding * 2 + contentBottomOffset.value + footerPad)

    return {
      top: `calc(var(--vh) * ${padding})`,
      right: `${padding}vw`,
      width: `${sidebarRightWidth.value}vw`,
      height: `calc(var(--vh) * ${fullHeight})`,
    }
  })

  const headerStyle = computed(() => {
    if (state.headerState === 'hidden') return { display: 'none' }

    const padding = sectionPaddingSize.value

    if (state.bigMode) {
      return {
        height: `calc(var(--vh) * ${headerHeight.value})`,
        width: `calc(100vw - ${padding * 2}vw)`,
        top: `calc(var(--vh) * ${padding})`,
        left: `${padding}vw`,
      }
    }

    return {
      height: `calc(var(--vh) * ${headerHeight.value})`,
      width: `${headerWidth.value}vw`,
      top: `calc(var(--vh) * ${padding})`,
      left: `${headerLeftInset.value}vw`,
    }
  })

  const centerPanelOffset = computed(() => {
    if (!state.showCorner) return 0
    const sizes = { small: 8, medium: 7, large: 6, extraLarge: 5 }
    return sizes[state.viewportSize]
  })

  const mainContentStyle = computed(() => {
    return {
      top: `calc(var(--vh) * ${contentTopOffset.value})`,
      left: `${mainContentLeft.value}vw`,
      width: `${mainContentWidth.value}vw`,
      height: `calc(var(--vh) * ${mainContentHeight.value})`,
      minHeight: '10vh',
    }
  })

  const centerContentStyle = computed(() => {
    const offsetTop = state.showCorner ? centerPanelOffset.value : 0

    return {
      marginTop: `calc(var(--vh) * ${offsetTop})`,
      height: `calc(100% - var(--vh) * ${offsetTop})`,
    } as CSSProperties
  })

  const footerStyle = computed(() => {
    const padding = sectionPaddingSize.value

    return {
      top: `calc(var(--vh) * ${100 - footerHeight.value - padding})`,
      left: `${footerLeftInset.value}vw`,
      width: `${footerWidth.value}vw`,
      height: `calc(var(--vh) * ${footerHeight.value})`,
    }
  })

  const isLargeViewport = computed(() =>
    ['large', 'extraLarge'].includes(state.viewportSize),
  )

  const headerModeLabel = computed(() => state.headerState)
  const footerModeLabel = computed(() => state.footerState)
  const leftSidebarModeLabel = computed(() => state.sidebarLeftState)
  const rightSidebarModeLabel = computed(() => state.sidebarRightState)

  function toggleFullscreen() {
    state.isFullScreen = !state.isFullScreen
    state.fullscreenState = state.isFullScreen ? 'fullscreen' : 'nuxt'
    state.headerState = state.isFullScreen ? 'hidden' : 'open'
    saveState()
  }

  function toggleCorner() {
    state.showCorner = !state.showCorner
    saveState()
  }

  function toggleHeader() {
    const order: DisplayState[] = ['open', 'compact', 'hidden']
    const currentIndex = order.indexOf(state.headerState)
    state.headerState = order[(currentIndex + 1) % order.length] ?? 'open'
    saveState()
  }

  function syncPriorityWithSidebar(side: 'left' | 'right', isVisible: boolean) {
    if (side === 'left') {
      if (!isVisible) {
        state.leftHeaderPriority = false
        state.leftFooterPriority = false
      } else {
        state.leftHeaderPriority = true
      }
    }

    if (side === 'right') {
      if (!isVisible) {
        state.rightHeaderPriority = false
        state.rightFooterPriority = false
      } else {
        state.rightHeaderPriority = true
      }
    }
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

    if (side === 'sidebarLeftState') {
      syncPriorityWithSidebar(
        'left',
        ['open', 'compact'].includes(state.sidebarLeftState),
      )
    }

    if (side === 'sidebarRightState') {
      syncPriorityWithSidebar(
        'right',
        ['open', 'compact'].includes(state.sidebarRightState),
      )
    }

    saveState()
  }

  function toggleFooter() {
    const order: DisplayState[] = ['compact', 'extended', 'hidden']
    const currentIndex = order.indexOf(state.footerState)
    state.footerState = order[(currentIndex + 1) % order.length] ?? 'compact'
    saveState()
  }

  function toggleBigMode() {
    state.bigMode = !state.bigMode
    saveState()
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
    state.currentAnimation =
      options[Math.floor(Math.random() * options.length)] ?? 'bubble-effect'
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
        setSectionState(section, false)
      } else {
        setSectionState('left', false)
        setSectionState('center', false)
        setSectionState('right', false)
        setSectionState(section, true)
      }
    } else {
      setSectionState(section, !isCurrentlyOn)
    }

    saveState()
  }

  function toggleExtended() {
    state.showExtended = !state.showExtended
    saveState()
  }

  function setExtraExpanded(val: boolean) {
    state.showExtended = val
    saveState()
  }

  function setSidebarRight(isOpen: boolean) {
    state.sidebarRightState = isOpen ? 'open' : 'hidden'
    syncPriorityWithSidebar('right', isOpen)
    saveState()
  }

  function setHeaderPriority(side: 'left' | 'right', value: boolean) {
    if (side === 'left') {
      state.leftHeaderPriority = value && sidebarLeftVisible.value
    } else {
      state.rightHeaderPriority = value && sidebarRightVisible.value
    }
    saveState()
  }

  function setFooterPriority(side: 'left' | 'right', value: boolean) {
    if (side === 'left') {
      state.leftFooterPriority = value && sidebarLeftVisible.value
    } else {
      state.rightFooterPriority = value && sidebarRightVisible.value
    }
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

    if (section === 'sidebarLeftState') {
      syncPriorityWithSidebar(
        'left',
        ['open', 'compact'].includes(state.sidebarLeftState),
      )
    }

    if (section === 'sidebarRightState') {
      syncPriorityWithSidebar(
        'right',
        ['open', 'compact'].includes(state.sidebarRightState),
      )
    }

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
    syncPriorityWithSidebar('right', opening)
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

      if (
        state.SmartState !== 'front' &&
        state.SmartState !== 'dash' &&
        state.SmartState !== 'back'
      ) {
        state.SmartState = 'front'
      }

      if (!sidebarLeftVisible.value) {
        state.leftHeaderPriority = false
        state.leftFooterPriority = false
      }

      if (!sidebarRightVisible.value) {
        state.rightHeaderPriority = false
        state.rightFooterPriority = false
      }
    } catch (error) {
      handleError(error, "Couldn't load state.")
    }
  }

  function setSmartState(next: SmartState) {
    if (next !== 'front' && next !== 'dash' && next !== 'back') {
      state.SmartState = 'front'
    } else {
      state.SmartState = next
    }
    saveState()
  }

  function toggleSmartFlip() {
    const order: SmartState[] = ['front', 'dash', 'back']
    const index = order.indexOf(state.SmartState)
    const nextIndex = index === -1 ? 0 : (index + 1) % order.length
    state.SmartState = order[nextIndex] ?? 'front'
    saveState()
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
        setCustomVh()
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
    resizeTimeout,

    sidebarLeftVisible,
    sidebarRightVisible,
    sidebarLeftWidth,
    sidebarRightWidth,

    headerHeight,
    footerHeight,
    sectionPaddingSize,
    sidebarContentHeight,
    mainContentHeight,
    mainContentWidth,
    mainContentLeft,
    mainContentRightInset,

    headerLeftInset,
    headerRightInset,
    headerWidth,
    footerLeftInset,
    footerRightInset,
    footerWidth,

    headerStyle,
    headerToggleStyle,
    cornerPanelStyle,
    cornerToggleStyle,
    leftToggleStyle,
    rightToggleStyle,
    footerToggleStyle,
    leftSidebarStyle,
    rightSidebarStyle,
    mainContentStyle,
    centerContentStyle,
    footerStyle,

    isLargeViewport,
    headerModeLabel,
    footerModeLabel,
    leftSidebarModeLabel,
    rightSidebarModeLabel,

    toggleFullscreen,
    toggleCorner,
    toggleHeader,
    toggleSidebar,
    toggleFooter,
    toggleBigMode,
    toggleSection,
    toggleExtended,
    toggleRandomAnimation,
    stopAnimation,
    toggleAnimationById,
    toggleTutorial,
    toggleSmartFlip,

    setMainComponent,
    setExtraExpanded,
    setSidebarRight,
    setHeaderPriority,
    setFooterPriority,
    changeState,
    setAction,
    setMode,
    saveState,
    loadState,
    updateViewport,
    initialize,
    removeViewportWatcher,
    setSmartState,
  }
})

export type { EffectId, displayModeState, displayActionState, SmartState }
