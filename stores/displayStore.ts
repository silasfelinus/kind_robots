// /stores/displayStore.ts
import { defineStore } from 'pinia'
import { reactive, ref, computed, toRefs, type CSSProperties } from 'vue'
import { handleError } from './utils'
import type {
  FlipState,
  displayModeState,
  displayActionState,
  EffectId,
  SmartState,
} from './helpers/displayHelper'
import { setCustomVh } from './helpers/displayHelper'

export type DisplayState =
  | 'hidden'
  | 'compact'
  | 'open'
  | 'full'
  | 'extended'
  | 'disabled'

type ViewportSize = 'mobile' | 'tablet' | 'desktop'

const HEADER_FOOTER_CYCLE: DisplayState[] = [
  'hidden',
  'compact',
  'open',
  'full',
]

const SIDEBAR_CYCLE: DisplayState[] = ['hidden', 'compact', 'open', 'full']

const SIZE_LABELS: Partial<Record<DisplayState, string>> = {
  hidden: 'Hidden',
  compact: 'Compact',
  open: 'Open',
  full: 'Full',
  extended: 'Extended',
  disabled: 'Disabled',
}

function normalizeDisplayState(
  value: unknown,
  allowed: DisplayState[],
  fallback: DisplayState,
): DisplayState {
  return typeof value === 'string' && allowed.includes(value as DisplayState)
    ? (value as DisplayState)
    : fallback
}

function nextState(
  current: DisplayState,
  cycle: DisplayState[],
  fallback: DisplayState,
): DisplayState {
  const index = cycle.indexOf(current)
  if (index === -1) return fallback
  return cycle[(index + 1) % cycle.length] ?? fallback
}

export const useDisplayStore = defineStore('displayStore', () => {
  const state = reactive({
    headerState: 'open' as DisplayState,
    sidebarLeftState: 'open' as DisplayState,
    sidebarRightState: 'open' as DisplayState,
    footerState: 'compact' as DisplayState,

    sidebarLeftHeaderPriority: false,
    sidebarLeftFooterPriority: false,
    sidebarRightHeaderPriority: false,
    sidebarRightFooterPriority: false,

    isVertical: false,
    viewportSize: 'desktop' as ViewportSize,
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

  const vh = (n: number) => `calc(var(--vh, 1vh) * ${n})`

  const sectionPaddingSize = computed((): number => {
    const sizes: Record<ViewportSize, number> = {
      mobile: 1,
      tablet: 1,
      desktop: 1,
    }
    return sizes[state.viewportSize]
  })

  const toggleInset = computed((): string => {
    if (state.viewportSize === 'mobile') return '0.35rem'
    if (state.viewportSize === 'tablet') return '0.45rem'
    return '0.5rem'
  })

  const toggleZIndex = computed((): string => '60')

  const headerHeight = computed((): number => {
    const p = sectionPaddingSize.value

    switch (state.headerState) {
      case 'hidden':
        return p
      case 'compact':
        return state.viewportSize === 'mobile' ? 5 : 4
      case 'full': {
        const sizes: Record<ViewportSize, number> = {
          mobile: 35,
          tablet: 28,
          desktop: 25,
        }
        return sizes[state.viewportSize]
      }
      default: {
        const sizes: Record<ViewportSize, number> = {
          mobile: state.bigMode ? 6 : 14,
          tablet: state.bigMode ? 12 : 13,
          desktop: state.bigMode ? 8 : 13,
        }
        return sizes[state.viewportSize]
      }
    }
  })

  const footerHeights: Record<string, Record<ViewportSize, number>> = {
    compact: { mobile: 6, tablet: 4, desktop: 4 },
    open: { mobile: 45, tablet: 25, desktop: 25 },
    full: { mobile: 55, tablet: 40, desktop: 40 },
    extended: { mobile: 55, tablet: 35, desktop: 45 },
  }

  const footerHeight = computed((): number => {
    const p = sectionPaddingSize.value
    if (state.footerState === 'hidden') return p
    return footerHeights[state.footerState]?.[state.viewportSize] ?? p
  })

  const sidebarLeftWidth = computed((): number => {
    const p = sectionPaddingSize.value

    switch (state.sidebarLeftState) {
      case 'hidden':
      case 'disabled':
        return p
      case 'compact': {
        const sizes: Record<ViewportSize, number> = {
          mobile: 14,
          tablet: 8,
          desktop: 6,
        }
        return sizes[state.viewportSize]
      }
      case 'full': {
        const sizes: Record<ViewportSize, number> = {
          mobile: 60,
          tablet: 28,
          desktop: 22,
        }
        return sizes[state.viewportSize]
      }
      default: {
        const sizes: Record<ViewportSize, number> = {
          mobile: 40,
          tablet: 20,
          desktop: 15,
        }
        return sizes[state.viewportSize]
      }
    }
  })

  const sidebarRightWidth = computed((): number => {
    const p = sectionPaddingSize.value

    switch (state.sidebarRightState) {
      case 'hidden':
      case 'disabled':
        return p
      case 'compact': {
        const sizes: Record<ViewportSize, number> = {
          mobile: 18,
          tablet: 12,
          desktop: 8,
        }
        return sizes[state.viewportSize]
      }
      case 'full': {
        const sizes: Record<ViewportSize, number> = {
          mobile: 100,
          tablet: 50,
          desktop: 36,
        }
        return sizes[state.viewportSize]
      }
      default: {
        const sizes: Record<ViewportSize, number> = {
          mobile: 90,
          tablet: 35,
          desktop: 25,
        }
        return sizes[state.viewportSize]
      }
    }
  })

  const leftSidebarVisible = computed(
    () => !['hidden', 'disabled'].includes(state.sidebarLeftState),
  )

  const rightSidebarVisible = computed(
    () => !['hidden', 'disabled'].includes(state.sidebarRightState),
  )

  function sidebarVh(
    sizeState: DisplayState,
    headerPriority: boolean,
    footerPriority: boolean,
  ): { top: number; height: number } {
    if (sizeState === 'full') return { top: 0, height: 100 }

    const p = sectionPaddingSize.value
    const hh = headerHeight.value
    const fh = footerHeight.value
    const topEdge = headerPriority ? 0 : hh + p
    const bottomEdge = footerPriority ? 0 : fh + p

    return {
      top: topEdge,
      height: Math.max(p, 100 - topEdge - bottomEdge),
    }
  }

  function sidebarZ(sizeState: DisplayState, hp: boolean, fp: boolean): number {
    if (sizeState === 'full') return 50
    if (hp || fp) return 40
    return 20
  }

  const headerLeftOffset = computed((): number => {
    return state.sidebarLeftHeaderPriority ? 0 : sidebarLeftWidth.value
  })

  const headerRightOffset = computed((): number => {
    return state.sidebarRightHeaderPriority ? 0 : sidebarRightWidth.value
  })

  const headerWidth = computed((): number => {
    return Math.max(0, 100 - headerLeftOffset.value - headerRightOffset.value)
  })

  const footerLeftOffset = computed((): number => {
    return state.sidebarLeftFooterPriority ? 0 : sidebarLeftWidth.value
  })

  const footerRightOffset = computed((): number => {
    return state.sidebarRightFooterPriority ? 0 : sidebarRightWidth.value
  })

  const footerWidth = computed((): number => {
    return Math.max(0, 100 - footerLeftOffset.value - footerRightOffset.value)
  })

  const centerTopOffset = computed((): number => {
    return headerHeight.value + sectionPaddingSize.value
  })

  const centerBottomOffset = computed((): number => {
    return footerHeight.value + sectionPaddingSize.value
  })

  const centerLeftOffset = computed((): number => {
    return sidebarLeftWidth.value + sectionPaddingSize.value
  })

  const centerRightOffset = computed((): number => {
    return sidebarRightWidth.value + sectionPaddingSize.value
  })

  const mainContentHeight = computed((): number => {
    return Math.max(
      sectionPaddingSize.value,
      100 - centerTopOffset.value - centerBottomOffset.value,
    )
  })

  const mainContentWidth = computed((): number => {
    return Math.max(
      10,
      100 - centerLeftOffset.value - centerRightOffset.value,
    )
  })

  const headerStyle = computed(
    (): CSSProperties => ({
      position: 'fixed',
      top: '0',
      left: `${headerLeftOffset.value}vw`,
      width: `${headerWidth.value}vw`,
      height: vh(headerHeight.value),
      zIndex: '30',
    }),
  )

  const footerStyle = computed(
    (): CSSProperties => ({
      position: 'fixed',
      bottom: '0',
      left: `${footerLeftOffset.value}vw`,
      width: `${footerWidth.value}vw`,
      height: vh(footerHeight.value),
      zIndex: '30',
    }),
  )

  const leftSidebarStyle = computed((): CSSProperties => {
    const { top, height } = sidebarVh(
      state.sidebarLeftState,
      state.sidebarLeftHeaderPriority,
      state.sidebarLeftFooterPriority,
    )

    return {
      position: 'fixed',
      left: '0',
      top: vh(top),
      width: `${sidebarLeftWidth.value}vw`,
      height: vh(height),
      zIndex: String(
        sidebarZ(
          state.sidebarLeftState,
          state.sidebarLeftHeaderPriority,
          state.sidebarLeftFooterPriority,
        ),
      ),
    }
  })

  const rightSidebarStyle = computed((): CSSProperties => {
    const { top, height } = sidebarVh(
      state.sidebarRightState,
      state.sidebarRightHeaderPriority,
      state.sidebarRightFooterPriority,
    )

    return {
      position: 'fixed',
      right: '0',
      top: vh(top),
      width: `${sidebarRightWidth.value}vw`,
      height: vh(height),
      zIndex: String(
        sidebarZ(
          state.sidebarRightState,
          state.sidebarRightHeaderPriority,
          state.sidebarRightFooterPriority,
        ),
      ),
    }
  })

  const mainContentStyle = computed((): CSSProperties => ({
    position: 'fixed',
    top: vh(centerTopOffset.value),
    left: `${centerLeftOffset.value}vw`,
    width: `${mainContentWidth.value}vw`,
    height: vh(mainContentHeight.value),
    zIndex: '10',
  }))

  const sidebarContentHeight = computed(() => mainContentHeight.value)
  const isLargeViewport = computed(() => state.viewportSize === 'desktop')
  const contentTopOffset = computed(() => centerTopOffset.value)
  const contentBottomOffset = computed(() => centerBottomOffset.value)

  const cornerPanelStyle = computed(
    (): CSSProperties => ({
      position: 'fixed',
      top: vh(contentTopOffset.value),
      right: `${sidebarRightWidth.value}vw`,
      zIndex: '15',
    }),
  )

  const headerToggleStyle = computed((): CSSProperties => {
    const rightOffset =
      rightSidebarVisible.value && state.sidebarRightHeaderPriority
        ? `calc(${sidebarRightWidth.value}vw + ${toggleInset.value})`
        : toggleInset.value

    return {
      position: 'fixed',
      top: toggleInset.value,
      right: rightOffset,
      zIndex: toggleZIndex.value,
    }
  })

  const leftToggleStyle = computed((): CSSProperties => {
    const { top } = sidebarVh(
      state.sidebarLeftState,
      state.sidebarLeftHeaderPriority,
      state.sidebarLeftFooterPriority,
    )

    return {
      position: 'fixed',
      top: `calc(${vh(top)} + ${toggleInset.value})`,
      left: toggleInset.value,
      zIndex: toggleZIndex.value,
    }
  })

  const rightToggleStyle = computed((): CSSProperties => {
    const { top } = sidebarVh(
      state.sidebarRightState,
      state.sidebarRightHeaderPriority,
      state.sidebarRightFooterPriority,
    )

    return {
      position: 'fixed',
      top: `calc(${vh(top)} + ${toggleInset.value})`,
      right: toggleInset.value,
      zIndex: toggleZIndex.value,
    }
  })

  const footerToggleStyle = computed((): CSSProperties => ({
    position: 'fixed',
    top: `calc(${vh(100 - footerHeight.value)} + ${toggleInset.value})`,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: toggleZIndex.value,
  }))

  const centerContentStyle = computed((): CSSProperties => ({ height: '100%' }))

  const headerModeLabel = computed(
    () => SIZE_LABELS[state.headerState] ?? state.headerState,
  )

  const footerModeLabel = computed(
    () => SIZE_LABELS[state.footerState] ?? state.footerState,
  )

  const leftSidebarModeLabel = computed(
    () => SIZE_LABELS[state.sidebarLeftState] ?? state.sidebarLeftState,
  )

  const rightSidebarModeLabel = computed(
    () => SIZE_LABELS[state.sidebarRightState] ?? state.sidebarRightState,
  )

  function toggleHeader() {
    state.headerState = nextState(
      state.headerState,
      HEADER_FOOTER_CYCLE,
      'open',
    )
    saveState()
  }

  function toggleFooter() {
    state.footerState = nextState(
      state.footerState,
      HEADER_FOOTER_CYCLE,
      'compact',
    )
    saveState()
  }

  function toggleLeftSidebar() {
    state.sidebarLeftState = nextState(
      state.sidebarLeftState,
      SIDEBAR_CYCLE,
      'open',
    )
    saveState()
  }

  function toggleRightSidebar() {
    state.sidebarRightState = nextState(
      state.sidebarRightState,
      SIDEBAR_CYCLE,
      'open',
    )
    saveState()
  }

  function toggleSidebarLeftHeaderPriority() {
    state.sidebarLeftHeaderPriority = !state.sidebarLeftHeaderPriority
    saveState()
  }

  function toggleSidebarLeftFooterPriority() {
    state.sidebarLeftFooterPriority = !state.sidebarLeftFooterPriority
    saveState()
  }

  function toggleSidebarRightHeaderPriority() {
    state.sidebarRightHeaderPriority = !state.sidebarRightHeaderPriority
    saveState()
  }

  function toggleSidebarRightFooterPriority() {
    state.sidebarRightFooterPriority = !state.sidebarRightFooterPriority
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
    state[section] = newState
    saveState()
  }

  function toggleSidebar(side: 'sidebarLeftState' | 'sidebarRightState') {
    if (side === 'sidebarLeftState') toggleLeftSidebar()
    else toggleRightSidebar()
  }

  function toggleFullscreen() {
    state.isFullScreen = !state.isFullScreen
    state.fullscreenState = state.isFullScreen ? 'fullscreen' : 'nuxt'
    state.headerState = state.isFullScreen ? 'hidden' : 'open'
    saveState()
  }

  function toggleCorner() {
    state.showCorner = !state.showCorner
  }

  function toggleBigMode() {
    state.bigMode = !state.bigMode
  }

  function setMainComponent(n: string) {
    state.mainComponent = n
  }

  function toggleRandomAnimation() {
    const opts = [
      'bubble-effect',
      'fizzy-bubbles',
      'rain-effect',
      'butterfly-animation',
    ]
    state.currentAnimation =
      opts[Math.floor(Math.random() * opts.length)] ?? 'bubble-effect'
    state.isAnimating = true
  }

  function stopAnimation() {
    state.isAnimating = false
    state.currentAnimation = ''
  }

  function toggleExtended() {
    state.showExtended = !state.showExtended
  }

  function setExtraExpanded(v: boolean) {
    state.showExtended = v
  }

  function setSidebarRight(open: boolean) {
    state.sidebarRightState = open ? 'open' : 'hidden'
    saveState()
  }

  function toggleAnimationById(id: EffectId) {
    state.currentAnimation = id
    state.isAnimating = true
  }

  function setAction(a: displayActionState) {
    state.displayAction = a
    saveState()
  }

  function setMode(m: displayModeState) {
    state.displayMode = m
    saveState()
  }

  function toggleSection(section: 'left' | 'center' | 'right') {
    const get = () =>
      section === 'left'
        ? state.showLeft
        : section === 'right'
          ? state.showRight
          : state.showCenter

    const set = (v: boolean) => {
      if (section === 'left') state.showLeft = v
      else if (section === 'center') state.showCenter = v
      else state.showRight = v
    }

    if (state.viewportSize === 'mobile') {
      if (get()) {
        set(false)
      } else {
        state.showLeft = false
        state.showCenter = false
        state.showRight = false
        set(true)
      }
    } else {
      set(!get())
    }

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

        const w = window.innerWidth
        state.isVertical = window.innerHeight > w
        state.isTouchDevice =
          'ontouchstart' in window || navigator.maxTouchPoints > 0

        if (w < 768) {
          state.viewportSize = 'mobile'
          state.isMobileViewport = true
        } else if (w < 1024) {
          state.viewportSize = 'tablet'
          state.isMobileViewport = false
        } else {
          state.viewportSize = 'desktop'
          state.isMobileViewport = false
        }
      } catch (e) {
        handleError(e, 'Custom width failed')
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

      state.headerState = normalizeDisplayState(
        state.headerState,
        HEADER_FOOTER_CYCLE,
        'open',
      )

      state.footerState = normalizeDisplayState(
        state.footerState,
        [...HEADER_FOOTER_CYCLE, 'extended'],
        'compact',
      )

      state.sidebarLeftState = normalizeDisplayState(
        state.sidebarLeftState,
        [...SIDEBAR_CYCLE, 'disabled'],
        'open',
      )

      state.sidebarRightState = normalizeDisplayState(
        state.sidebarRightState,
        [...SIDEBAR_CYCLE, 'disabled'],
        'open',
      )

      if (!['mobile', 'tablet', 'desktop'].includes(state.viewportSize)) {
        state.viewportSize = 'desktop'
      }

      if (!['front', 'dash', 'back'].includes(state.SmartState as string)) {
        state.SmartState = 'front'
      }
    } catch (e) {
      handleError(e, "Couldn't load state.")
    }
  }

  function setSmartState(next: SmartState) {
    state.SmartState = ['front', 'dash', 'back'].includes(next) ? next : 'front'
    saveState()
  }

  function toggleSmartFlip() {
    const order: SmartState[] = ['front', 'dash', 'back']
    const i = order.indexOf(state.SmartState)
    state.SmartState = order[(i === -1 ? 0 : i + 1) % order.length] ?? 'front'
    saveState()
  }

  function saveState() {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem('displayStoreState', JSON.stringify(state))
    } catch (e) {
      handleError(e, "couldn't save state.")
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
      } catch (e) {
        handleError(e, 'Task Failed: ')
      }
    })
  }

  return {
    ...toRefs(state),
    sectionPaddingSize,
    toggleInset,
    headerHeight,
    footerHeight,
    sidebarLeftWidth,
    sidebarRightWidth,
    headerLeftOffset,
    headerRightOffset,
    headerWidth,
    footerLeftOffset,
    footerRightOffset,
    footerWidth,
    centerTopOffset,
    centerBottomOffset,
    centerLeftOffset,
    centerRightOffset,
    mainContentHeight,
    mainContentWidth,
    sidebarContentHeight,
    isLargeViewport,
    contentTopOffset,
    contentBottomOffset,
    headerStyle,
    footerStyle,
    leftSidebarStyle,
    rightSidebarStyle,
    mainContentStyle,
    centerContentStyle,
    cornerPanelStyle,
    headerToggleStyle,
    leftToggleStyle,
    rightToggleStyle,
    footerToggleStyle,
    leftSidebarVisible,
    rightSidebarVisible,
    headerModeLabel,
    footerModeLabel,
    leftSidebarModeLabel,
    rightSidebarModeLabel,
    toggleHeader,
    toggleFooter,
    toggleLeftSidebar,
    toggleRightSidebar,
    toggleSidebar,
    toggleSidebarLeftHeaderPriority,
    toggleSidebarLeftFooterPriority,
    toggleSidebarRightHeaderPriority,
    toggleSidebarRightFooterPriority,
    changeState,
    toggleCorner,
    toggleSection,
    toggleExtended,
    toggleFullscreen,
    toggleBigMode,
    setMainComponent,
    toggleRandomAnimation,
    stopAnimation,
    setExtraExpanded,
    toggleAnimationById,
    setAction,
    setMode,
    toggleTutorial,
    setSidebarRight,
    saveState,
    loadState,
    updateViewport,
    initialize,
    removeViewportWatcher,
    setSmartState,
    toggleSmartFlip,
    resizeTimeout,
  }
})

export type {
  EffectId,
  displayModeState,
  displayActionState,
  SmartState,
  ViewportSize,
}