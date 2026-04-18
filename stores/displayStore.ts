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

export type ViewportSize = 'small' | 'medium' | 'large' | 'extraLarge'
type FullscreenState = 'nuxt' | 'fullscreen'
type SidebarStage = 'hidden' | 'compact' | 'open' | 'priority'
type SidebarStateKey = 'sidebarLeftState' | 'sidebarRightState'
type LogicalSide = 'left' | 'right'

export const useDisplayStore = defineStore('displayStore', () => {
  const state = reactive({
    headerState: 'open' as DisplayState,
    sidebarLeftState: 'compact' as DisplayState,
    sidebarRightState: 'hidden' as DisplayState,
    footerState: 'hidden' as DisplayState,

    isVertical: false,
    viewportSize: 'large' as ViewportSize,
    isTouchDevice: false,
    showTutorial: true,
    isInitialized: false,
    flipState: 'tutorial' as FlipState,
    isFullScreen: false,
    isMobileViewport: true,
    isAnimating: false,
    currentAnimation: '',
    fullscreenState: 'nuxt' as FullscreenState,
    bigMode: false,
    displayMode: 'scenario' as displayModeState,
    displayAction: 'gallery' as displayActionState,
    previousRoute: '',
    mainComponent: '',
    showLeft: true,
    showCenter: true,
    showRight: true,
    showExtended: false,
    showCorner: false,
    SmartState: 'front' as SmartState,
  })

  const resizeTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

  function normalizeSidebarState(value: DisplayState): SidebarStage {
    if (value === 'hidden') return 'hidden'
    if (value === 'compact') return 'compact'
    if (value === 'priority') return 'priority'
    return 'open'
  }

  const fullColumnTopOffset = computed(() => {
    return sectionPaddingSize.value
  })

  const fullColumnHeight = computed(() => {
    return 100 - sectionPaddingSize.value * 2
  })

  const leftSidebarStage = computed<SidebarStage>(() => {
    return normalizeSidebarState(state.sidebarLeftState)
  })

  const rightSidebarStage = computed<SidebarStage>(() => {
    return normalizeSidebarState(state.sidebarRightState)
  })

  const sidebarLeftVisible = computed(() => leftSidebarStage.value !== 'hidden')
  const sidebarRightVisible = computed(
    () => rightSidebarStage.value !== 'hidden',
  )

  const leftSidebarPriority = computed(
    () => leftSidebarStage.value === 'priority',
  )

  const rightSidebarPriority = computed(
    () => rightSidebarStage.value === 'priority',
  )

  const hasPrioritySidebar = computed(() => {
    return leftSidebarPriority.value || rightSidebarPriority.value
  })

  const mainPanelTopOffset = computed(() => {
    if (hasPrioritySidebar.value) {
      return sectionPaddingSize.value
    }

    return contentTopOffset.value
  })

  const mainPanelHeight = computed(() => {
    if (hasPrioritySidebar.value) {
      return (
        100 -
        sectionPaddingSize.value * 2 -
        footerHeight.value -
        (footerVisible.value ? sectionPaddingSize.value : 0)
      )
    }

    return mainContentHeight.value
  })

  const mainInnerTopInset = computed(() => {
    let inset = 0

    if (hasPrioritySidebar.value && state.headerState !== 'hidden') {
      inset += headerHeight.value + sectionPaddingSize.value
    }

    inset += cornerPanelLineInset.value

    return inset
  })

  const sidebarLeftWidth = computed(() => {
    const widths: Record<ViewportSize, Record<SidebarStage, number>> = {
      small: { hidden: 0, compact: 35, open: 40, priority: 50 },
      medium: { hidden: 0, compact: 30, open: 35, priority: 40 },
      large: { hidden: 0, compact: 24, open: 30, priority: 35 },
      extraLarge: { hidden: 0, compact: 17, open: 22, priority: 30 },
    }

    return widths[state.viewportSize][leftSidebarStage.value]
  })

  const sidebarRightWidth = computed(() => {
    const widths: Record<ViewportSize, Record<SidebarStage, number>> = {
      small: { hidden: 0, compact: 18, open: 32, priority: 32 },
      medium: { hidden: 0, compact: 30, open: 35, priority: 40 },
      large: { hidden: 0, compact: 24, open: 30, priority: 35 },
      extraLarge: { hidden: 0, compact: 17, open: 22, priority: 30 },
    }

    return widths[state.viewportSize][rightSidebarStage.value]
  })

  const headerHeight = computed(() => {
    if (state.headerState === 'hidden') return 0

    const sizes: Record<ViewportSize, number> = {
      small: state.bigMode ? 6 : 14,
      medium: state.bigMode ? 12 : 13,
      large: state.bigMode ? 10 : 12,
      extraLarge: state.bigMode ? 8 : 13,
    }

    return sizes[state.viewportSize]
  })

  const footerHeights = {
    hidden: { small: 0, medium: 0, large: 0, extraLarge: 0 },
    compact: { small: 16, medium: 12, large: 10, extraLarge: 8 },
    open: { small: 22, medium: 18, large: 24, extraLarge: 18 },
    priority: { small: 50, medium: 50, large: 50, extraLarge: 50 },
    disabled: { small: 0, medium: 0, large: 0, extraLarge: 0 },
  } as const

  const sectionPaddingSize = computed(() => {
    const sizes: Record<ViewportSize, number> = {
      small: 1,
      medium: 1,
      large: 2,
      extraLarge: 2,
    }

    return sizes[state.viewportSize]
  })

  const footerVisible = computed(() => state.footerState !== 'hidden')

  const footerHeight = computed(() => {
    const stateKey =
      state.footerState === 'compact' ||
      state.footerState === 'open' ||
      state.footerState === 'hidden' ||
      state.footerState === 'priority' ||
      state.footerState === 'disabled'
        ? state.footerState
        : 'hidden'

    return footerHeights[stateKey][state.viewportSize]
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
    return leftSidebarPriority.value
      ? padding + sidebarLeftWidth.value
      : padding
  })

  const headerRightInset = computed(() => {
    const padding = sectionPaddingSize.value
    return rightSidebarPriority.value
      ? padding + sidebarRightWidth.value
      : padding
  })

  const headerWidth = computed(() => {
    return 100 - headerLeftInset.value - headerRightInset.value
  })

  const footerLeftInset = computed(() => {
    const padding = sectionPaddingSize.value
    return leftSidebarPriority.value
      ? padding + sidebarLeftWidth.value
      : padding
  })

  const footerRightInset = computed(() => {
    const padding = sectionPaddingSize.value
    return rightSidebarPriority.value
      ? padding + sidebarRightWidth.value
      : padding
  })

  const footerWidth = computed(() => {
    return 100 - footerLeftInset.value - footerRightInset.value
  })

  const leftToggleStyle = computed<CSSProperties>(() => {
    const header = state.headerState === 'hidden' ? 0 : headerHeight.value
    const leftOffset = sidebarLeftVisible.value
      ? sectionPaddingSize.value + sidebarLeftWidth.value
      : sectionPaddingSize.value

    return {
      top: `calc(var(--vh) * ${header + sectionPaddingSize.value * 2})`,
      left: `${leftOffset}vw`,
      zIndex: '70',
    }
  })

  const rightToggleStyle = computed<CSSProperties>(() => {
    const header = state.headerState === 'hidden' ? 0 : headerHeight.value
    const rightOffset = sidebarRightVisible.value
      ? sectionPaddingSize.value + sidebarRightWidth.value
      : sectionPaddingSize.value

    return {
      top: `calc(var(--vh) * ${header + sectionPaddingSize.value * 2})`,
      right: `${rightOffset}vw`,
      zIndex: '70',
    }
  })

  const footerToggleStyle = computed<CSSProperties>(() => {
    const padding = sectionPaddingSize.value
    const footerTop = 100 - footerHeight.value - padding

    return {
      position: 'fixed',
      left: '50%',
      top: `calc(var(--vh) * ${footerTop} - 0.9rem)`,
      transform: 'translateX(-50%)',
      zIndex: '80',
    }
  })
  const headerToggleStyle = computed<CSSProperties>(() => ({
    position: 'fixed',
    top: `calc(var(--vh) * ${Math.max(0.5, sectionPaddingSize.value + 0.75)})`,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '80',
  }))

  const cornerPanelStyle = computed<CSSProperties>(() => {
    const rightInset = mainContentRightInset.value

    return {
      top: `calc(var(--vh) * ${contentTopOffset.value} + 0.75rem)`,
      right: `${rightInset}vw`,
      zIndex: '40',
    }
  })

  const leftSidebarStyle = computed<CSSProperties>(() => {
    const padding = sectionPaddingSize.value
    const header = state.headerState === 'hidden' ? 0 : headerHeight.value

    if (!sidebarLeftVisible.value) {
      return {
        top: `calc(var(--vh) * ${header + padding * 2})`,
        left: `${padding}vw`,
        width: '0px',
        height: '0px',
      }
    }

    if (leftSidebarPriority.value) {
      return {
        top: `calc(var(--vh) * ${fullColumnTopOffset.value})`,
        left: `${padding}vw`,
        width: `${sidebarLeftWidth.value}vw`,
        height: `calc(var(--vh) * ${fullColumnHeight.value})`,
      }
    }

    return {
      top: `calc(var(--vh) * ${header + padding * 2})`,
      left: `${padding}vw`,
      width: `${sidebarLeftWidth.value}vw`,
      height: `calc(var(--vh) * ${sidebarContentHeight.value})`,
    }
  })
  const rightSidebarStyle = computed<CSSProperties>(() => {
    const padding = sectionPaddingSize.value
    const header = state.headerState === 'hidden' ? 0 : headerHeight.value

    if (!sidebarRightVisible.value) {
      return {
        top: `calc(var(--vh) * ${header + padding * 2})`,
        right: `${padding}vw`,
        width: '0px',
        height: '0px',
      }
    }

    if (rightSidebarPriority.value) {
      return {
        top: `calc(var(--vh) * ${fullColumnTopOffset.value})`,
        right: `${padding}vw`,
        width: `${sidebarRightWidth.value}vw`,
        height: `calc(var(--vh) * ${fullColumnHeight.value})`,
      }
    }

    return {
      top: `calc(var(--vh) * ${header + padding * 2})`,
      right: `${padding}vw`,
      width: `${sidebarRightWidth.value}vw`,
      height: `calc(var(--vh) * ${sidebarContentHeight.value})`,
    }
  })

  const headerStyle = computed<CSSProperties>(() => {
    if (state.headerState === 'hidden') {
      return { display: 'none' }
    }

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

    const sizes: Record<ViewportSize, number> = {
      small: 8,
      medium: 7,
      large: 6,
      extraLarge: 5,
    }

    return sizes[state.viewportSize]
  })

  const cornerPanelLineInset = computed(() => {
    if (!hasPrioritySidebar.value || state.headerState === 'hidden') return 0

    const sizes: Record<ViewportSize, number> = {
      small: 4,
      medium: 3,
      large: 2.5,
      extraLarge: 2,
    }

    return sizes[state.viewportSize]
  })

  const mainContentStyle = computed<CSSProperties>(() => {
    let topInset = 0

    if (hasPrioritySidebar.value) {
      topInset += mainInnerTopInset.value
    }

    return {
      height: '100%',
      paddingTop: `calc(var(--vh) * ${topInset})`,
    }
  })

  const centerContentStyle = computed<CSSProperties>(() => {
    return {
      top: `calc(var(--vh) * ${mainPanelTopOffset.value})`,
      left: `${mainContentLeft.value}vw`,
      width: `${mainContentWidth.value}vw`,
      height: `calc(var(--vh) * ${mainPanelHeight.value})`,
      minHeight: '10vh',
    }
  })

  const footerStyle = computed<CSSProperties>(() => {
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
  const leftSidebarModeLabel = computed(() => leftSidebarStage.value)
  const rightSidebarModeLabel = computed(() => rightSidebarStage.value)

  function getOppositeSide(side: LogicalSide): LogicalSide {
    return side === 'left' ? 'right' : 'left'
  }

  function getSidebarKey(side: LogicalSide): SidebarStateKey {
    return side === 'left' ? 'sidebarLeftState' : 'sidebarRightState'
  }

  function getSidebarStage(side: LogicalSide): SidebarStage {
    return side === 'left' ? leftSidebarStage.value : rightSidebarStage.value
  }

  function setSidebarStage(side: LogicalSide, stage: SidebarStage) {
    const key = getSidebarKey(side)

    if (stage === 'priority' && state.viewportSize === 'small') {
      const oppositeSide = getOppositeSide(side)
      const oppositeKey = getSidebarKey(oppositeSide)
      const oppositeStage = getSidebarStage(oppositeSide)

      if (oppositeStage === 'priority') {
        state[oppositeKey] = 'open'
      }
    }

    state[key] = stage
  }

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

  function toggleHeader(mode: 'cycle' | 'open' = 'cycle') {
    if (mode === 'open') {
      state.headerState = 'open'
      saveState()
      return
    }

    const order: DisplayState[] = ['open', 'compact', 'hidden']
    const currentIndex = Math.max(0, order.indexOf(state.headerState))
    state.headerState = order[(currentIndex + 1) % order.length] ?? 'open'
    saveState()
  }

  const headerCornerToggleStyle = computed<CSSProperties>(() => {
    const padding = sectionPaddingSize.value

    return {
      top: `calc(var(--vh) * ${padding + 0.5})`,
      left: `${padding + 0.75}rem`,
    }
  })

  function toggleSidebar(side: SidebarStateKey) {
    const logical: LogicalSide = side === 'sidebarLeftState' ? 'left' : 'right'
    const order: SidebarStage[] = ['hidden', 'compact', 'open', 'priority']
    const current = getSidebarStage(logical)
    const next = order[(order.indexOf(current) + 1) % order.length] ?? 'hidden'

    setSidebarStage(logical, next)
    saveState()
  }

  function toggleLeftSidebar() {
    toggleSidebar('sidebarLeftState')
  }

  function toggleRightSidebar() {
    toggleSidebar('sidebarRightState')
  }

  function toggleFooter() {
    const order: DisplayState[] = ['compact', 'open', 'priority', 'hidden']
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
      else state.showRight = value
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
    if (section === 'sidebarLeftState') {
      setSidebarStage('left', normalizeSidebarState(newState))
      saveState()
      return
    }

    if (section === 'sidebarRightState') {
      setSidebarStage('right', normalizeSidebarState(newState))
      saveState()
      return
    }

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

        if (
          state.viewportSize === 'small' &&
          state.sidebarLeftState === 'priority' &&
          state.sidebarRightState === 'priority'
        ) {
          state.sidebarRightState = 'open'
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
      if (saved) {
        Object.assign(state, JSON.parse(saved))
      }

      if (
        state.SmartState !== 'front' &&
        state.SmartState !== 'dash' &&
        state.SmartState !== 'back'
      ) {
        state.SmartState = 'front'
      }

      state.sidebarLeftState = normalizeSidebarState(
        state.sidebarLeftState,
      ) as DisplayState
      state.sidebarRightState = normalizeSidebarState(
        state.sidebarRightState,
      ) as DisplayState

      if (
        state.viewportSize === 'small' &&
        state.sidebarLeftState === 'priority' &&
        state.sidebarRightState === 'priority'
      ) {
        state.sidebarRightState = 'open'
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

    leftSidebarStage,
    rightSidebarStage,
    sidebarLeftVisible,
    sidebarRightVisible,
    leftSidebarPriority,
    rightSidebarPriority,
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

    getSidebarStage,
    setSidebarStage,
    toggleFullscreen,
    toggleCorner,
    toggleHeader,
    toggleSidebar,
    toggleLeftSidebar,
    toggleRightSidebar,
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
    changeState,
    setAction,
    setMode,
    saveState,
    loadState,
    updateViewport,
    initialize,
    removeViewportWatcher,
    setSmartState,
    headerCornerToggleStyle,
  }
})

export type { EffectId, displayModeState, displayActionState, SmartState }
