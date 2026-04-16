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

  // ─── Padding ──────────────────────────────────────────────────────────────────
  // Applied once between every adjacent pair of regions.
  // This is also the MINIMUM size of any region when state === 'hidden'.
  const sectionPaddingSize = computed((): number => {
    const sizes: Record<ViewportSize, number> = {
      mobile: 1,
      tablet: 1,
      desktop: 1,
    }
    return sizes[state.viewportSize]
  })

  // ─── Raw heights (vh units) ───────────────────────────────────────────────────
  // 'hidden' returns sectionPaddingSize — region is always present, just minimal.

  const headerHeight = computed((): number => {
    const p = sectionPaddingSize.value
    switch (state.headerState) {
      case 'hidden':
        return p
      case 'compact':
        return state.viewportSize === 'mobile' ? 5 : 4
      case 'full': {
        const s: Record<ViewportSize, number> = {
          mobile: 35,
          tablet: 28,
          desktop: 25,
        }
        return s[state.viewportSize]
      }
      default: {
        // 'open'
        const s: Record<ViewportSize, number> = {
          mobile: state.bigMode ? 6 : 14,
          tablet: state.bigMode ? 12 : 13,
          desktop: state.bigMode ? 8 : 13,
        }
        return s[state.viewportSize]
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

  // ─── Raw widths (vw units) ────────────────────────────────────────────────────
  // 'hidden' returns sectionPaddingSize — always a sliver.

  const sidebarLeftWidth = computed((): number => {
    const p = sectionPaddingSize.value
    if (['hidden', 'disabled'].includes(state.sidebarLeftState)) return p
    const sizes: Record<ViewportSize, number> = {
      mobile: 40,
      tablet: 20,
      desktop: 15,
    }
    return sizes[state.viewportSize]
  })

  const sidebarRightWidth = computed((): number => {
    const p = sectionPaddingSize.value
    if (['hidden', 'disabled'].includes(state.sidebarRightState)) return p
    const sizes: Record<ViewportSize, number> = {
      mobile: 90,
      tablet: 35,
      desktop: 25,
    }
    return sizes[state.viewportSize]
  })

  // ─── Geometry ─────────────────────────────────────────────────────────────────
  //
  // All values in vh (vertical) or vw (horizontal).
  // p = sectionPaddingSize — gap between every adjacent pair of regions.
  //
  // Header:   top=0,             height=headerHeight   (always ≥ p)
  // Footer:   bottom=0,          height=footerHeight   (always ≥ p)
  // Sidebar:  top/height depend on priority flags and header/footer heights
  // Center:   fills remaining space after all four surrounding regions
  //
  // Sidebar geometry:
  //   topEdge    = headerPriority ? 0 : headerHeight + p
  //   bottomEdge = footerPriority ? 0 : footerHeight + p
  //   top        = topEdge
  //   height     = 100 - topEdge - bottomEdge
  //   'full' state → top=0, height=100 regardless of priority
  //
  // Center:
  //   top    = headerHeight + p
  //   left   = sidebarLeftWidth + p   (vw)
  //   width  = 100 - sidebarLeftWidth - sidebarRightWidth - p*2
  //   height = 100 - headerHeight - footerHeight - p*2

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
    return { top: topEdge, height: 100 - topEdge - bottomEdge }
  }

  function sidebarZ(sizeState: DisplayState, hp: boolean, fp: boolean): number {
    if (sizeState === 'full') return 50
    if (hp || fp) return 40
    return 20
  }

  const vh = (n: number) => `calc(var(--vh, 1vh) * ${n})`

  // ─── Computed styles ──────────────────────────────────────────────────────────
  // Every region ALWAYS returns a valid positioned style — no display:none ever.
  // position:fixed is set here; layout elements must not add their own position class.

  const headerStyle = computed(
    (): CSSProperties => ({
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: vh(headerHeight.value),
      zIndex: '30',
    }),
  )

  const footerStyle = computed(
    (): CSSProperties => ({
      position: 'fixed',
      bottom: '0',
      left: '0',
      width: '100vw',
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

  const mainContentHeight = computed((): number => {
    const p = sectionPaddingSize.value
    return 100 - headerHeight.value - footerHeight.value - p * 2
  })

  const mainContentWidth = computed((): number => {
    const p = sectionPaddingSize.value
    return 100 - sidebarLeftWidth.value - sidebarRightWidth.value - p * 2
  })

  const mainContentStyle = computed((): CSSProperties => {
    const p = sectionPaddingSize.value
    return {
      position: 'fixed',
      top: vh(headerHeight.value + p),
      left: `calc(${sidebarLeftWidth.value}vw + ${vh(p)})`,
      width: `${mainContentWidth.value}vw`,
      height: vh(mainContentHeight.value),
      zIndex: '10',
    }
  })

  // ─── Compat / legacy ──────────────────────────────────────────────────────────

  const sidebarContentHeight = computed(() => mainContentHeight.value)
  const isLargeViewport = computed(() => state.viewportSize === 'desktop')
  const contentTopOffset = computed(
    () => headerHeight.value + sectionPaddingSize.value,
  )
  const contentBottomOffset = computed(
    () => footerHeight.value + sectionPaddingSize.value,
  )

  const cornerPanelStyle = computed(
    (): CSSProperties => ({
      position: 'fixed',
      top: vh(contentTopOffset.value),
      right: `${sidebarRightWidth.value}vw`,
      zIndex: '15',
    }),
  )
  const leftToggleStyle = computed(
    (): CSSProperties => ({
      position: 'fixed',
      top: vh(contentTopOffset.value),
      left: '0',
      zIndex: '35',
    }),
  )
  const rightToggleStyle = computed(
    (): CSSProperties => ({
      position: 'fixed',
      top: vh(contentTopOffset.value),
      right: '0',
      zIndex: '35',
    }),
  )
  const footerToggleStyle = computed(
    (): CSSProperties => ({
      position: 'fixed',
      bottom: '0',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '50',
    }),
  )
  const centerContentStyle = computed((): CSSProperties => ({ height: '100%' }))

  // ─── Mode labels ──────────────────────────────────────────────────────────────

  const SIZE_LABELS: Partial<Record<DisplayState, string>> = {
    hidden: 'Hidden',
    compact: 'Compact',
    open: 'Open',
    full: 'Full',
    extended: 'Extended',
    disabled: 'Disabled',
  }
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

  // ─── Toggles ──────────────────────────────────────────────────────────────────

  function toggleHeader() {
    const idx = HEADER_FOOTER_CYCLE.indexOf(state.headerState)
    state.headerState =
      HEADER_FOOTER_CYCLE[(idx + 1) % HEADER_FOOTER_CYCLE.length] ?? 'open'
    saveState()
  }
  function toggleFooter() {
    const idx = HEADER_FOOTER_CYCLE.indexOf(state.footerState)
    state.footerState =
      HEADER_FOOTER_CYCLE[(idx + 1) % HEADER_FOOTER_CYCLE.length] ?? 'hidden'
    saveState()
  }
  function toggleLeftSidebar() {
    const idx = SIDEBAR_CYCLE.indexOf(state.sidebarLeftState)
    state.sidebarLeftState =
      SIDEBAR_CYCLE[(idx + 1) % SIDEBAR_CYCLE.length] ?? 'hidden'
    saveState()
  }
  function toggleRightSidebar() {
    const idx = SIDEBAR_CYCLE.indexOf(state.sidebarRightState)
    state.sidebarRightState =
      SIDEBAR_CYCLE[(idx + 1) % SIDEBAR_CYCLE.length] ?? 'hidden'
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

  // ─── Other actions ────────────────────────────────────────────────────────────

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
      if (saved) Object.assign(state, JSON.parse(saved))
      if (!['mobile', 'tablet', 'desktop'].includes(state.viewportSize))
        state.viewportSize = 'desktop'
      if (!['front', 'dash', 'back'].includes(state.SmartState as string))
        state.SmartState = 'front'
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
    headerHeight,
    footerHeight,
    sidebarLeftWidth,
    sidebarRightWidth,
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
