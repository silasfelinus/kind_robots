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

// ─── DisplayState ─────────────────────────────────────────────────────────────
// Size/visibility axis only. Priority is a separate boolean per sidebar.
export type DisplayState =
  | 'hidden'
  | 'compact'
  | 'open'
  | 'full'
  | 'extended'
  | 'disabled'

type ViewportSize = 'mobile' | 'tablet' | 'desktop'

// Header / footer size cycle: hidden → compact → open → full → hidden
const HEADER_FOOTER_CYCLE: DisplayState[] = [
  'hidden',
  'compact',
  'open',
  'full',
]

// Sidebar size cycle: hidden → compact → open → full → hidden
const SIDEBAR_CYCLE: DisplayState[] = ['hidden', 'compact', 'open', 'full']

export const useDisplayStore = defineStore('displayStore', () => {
  const state = reactive({
    // ── Region size/visibility states ──
    headerState: 'open' as DisplayState,
    sidebarLeftState: 'open' as DisplayState,
    sidebarRightState: 'open' as DisplayState,
    footerState: 'compact' as DisplayState,

    // ── Sidebar priority booleans ──────────────────────────────────────────────
    // headerPriority: sidebar top edge aligns with screen top (overlaps header)
    // footerPriority: sidebar bottom edge aligns with screen bottom (overlaps footer)
    // Both false → inset (sits between header and footer)
    // Both true  → equivalent to full (top: 0, height: 100%)
    sidebarLeftHeaderPriority: false,
    sidebarLeftFooterPriority: false,
    sidebarRightHeaderPriority: false,
    sidebarRightFooterPriority: false,

    // ── Rest of state (unchanged) ──
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

  // ─── Sidebar widths ──────────────────────────────────────────────────────────

  const sidebarLeftWidth = computed(() => {
    const sizes: Record<ViewportSize, number> = {
      mobile: 16,
      tablet: 11,
      desktop: 9,
    }
    return ['hidden', 'disabled'].includes(state.sidebarLeftState)
      ? 0
      : sizes[state.viewportSize]
  })

  const sidebarRightWidth = computed(() => {
    const sizes: Record<ViewportSize, number> = {
      mobile: 98,
      tablet: 40,
      desktop: 30,
    }
    return ['hidden', 'disabled'].includes(state.sidebarRightState)
      ? 0
      : sizes[state.viewportSize]
  })

  // ─── Header height ───────────────────────────────────────────────────────────

  const headerHeight = computed(() => {
    switch (state.headerState) {
      case 'hidden':
        return 0
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
      case 'open':
      default: {
        const s: Record<ViewportSize, number> = {
          mobile: state.bigMode ? 6 : 14,
          tablet: state.bigMode ? 12 : 13,
          desktop: state.bigMode ? 8 : 13,
        }
        return s[state.viewportSize]
      }
    }
  })

  // ─── Footer height ───────────────────────────────────────────────────────────

  const footerHeights: Record<string, Record<ViewportSize, number>> = {
    hidden: { mobile: 0, tablet: 0, desktop: 0 },
    compact: { mobile: 6, tablet: 4, desktop: 4 },
    open: { mobile: 45, tablet: 25, desktop: 25 },
    full: { mobile: 55, tablet: 40, desktop: 40 },
    extended: { mobile: 55, tablet: 35, desktop: 45 },
  }

  const footerHeight = computed(() => {
    const key =
      state.footerState in footerHeights ? state.footerState : 'hidden'
    return footerHeights[key]![state.viewportSize] ?? 0
  })

  // ─── Derived layout values ───────────────────────────────────────────────────

  const sectionPaddingSize = computed(() => 0)
  const footerVisible = computed(() => state.footerState !== 'hidden')
  const contentTopOffset = computed(() => headerHeight.value)
  const contentBottomOffset = computed(() =>
    footerVisible.value ? footerHeight.value : 0,
  )
  const mainContentHeight = computed(
    () => 100 - headerHeight.value - footerHeight.value,
  )
  const mainContentWidth = computed(
    () =>
      100 -
      (['hidden', 'disabled'].includes(state.sidebarRightState)
        ? 0
        : sidebarRightWidth.value),
  )
  const sidebarContentHeight = computed(() => mainContentHeight.value)
  const isLargeViewport = computed(() => state.viewportSize === 'desktop')

  // ─── Sidebar geometry ────────────────────────────────────────────────────────
  // Reads size state AND the two priority booleans for that sidebar.
  // top and height are in vh units (0–100).
  //
  //   headerPriority  footerPriority  →  top edge        bottom edge
  //   false           false           →  below header    above footer   (inset)
  //   true            false           →  screen top      above footer   (header priority)
  //   false           true            →  below header    screen bottom  (footer priority)
  //   true            true            →  screen top      screen bottom  (full override)

  function sidebarGeometry(
    sizeState: DisplayState,
    headerPriority: boolean,
    footerPriority: boolean,
  ): { top: number; height: number } {
    // 'full' overrides priority flags — always full screen
    if (sizeState === 'full') return { top: 0, height: 100 }

    const hh = headerHeight.value
    const fh = footerHeight.value
    const top = headerPriority ? 0 : hh
    const bottom = footerPriority ? 0 : fh
    return { top, height: 100 - top - bottom }
  }

  function sidebarZIndex(
    sizeState: DisplayState,
    headerPriority: boolean,
    footerPriority: boolean,
  ): number {
    if (sizeState === 'full') return 50 // above everything
    if (headerPriority || footerPriority) return 40 // above one boundary
    return 20 // fully inset
  }

  // ─── Computed styles ─────────────────────────────────────────────────────────

  const headerStyle = computed((): CSSProperties => {
    if (state.headerState === 'hidden') return { display: 'none' }
    return {
      height: `calc(var(--vh, 1vh) * ${headerHeight.value})`,
      width: '100%',
      zIndex: '30',
    }
  })

  const footerStyle = computed((): CSSProperties => {
    if (state.footerState === 'hidden') return { display: 'none' }
    return {
      height: `calc(var(--vh, 1vh) * ${footerHeight.value})`,
      width: '100%',
      zIndex: '30',
    }
  })

  const leftSidebarStyle = computed((): CSSProperties => {
    if (['hidden', 'disabled'].includes(state.sidebarLeftState))
      return { display: 'none' }
    const { top, height } = sidebarGeometry(
      state.sidebarLeftState,
      state.sidebarLeftHeaderPriority,
      state.sidebarLeftFooterPriority,
    )
    return {
      position: 'fixed',
      left: '0',
      top: `calc(var(--vh, 1vh) * ${top})`,
      width: `${sidebarLeftWidth.value}vw`,
      height: `calc(var(--vh, 1vh) * ${height})`,
      zIndex: String(
        sidebarZIndex(
          state.sidebarLeftState,
          state.sidebarLeftHeaderPriority,
          state.sidebarLeftFooterPriority,
        ),
      ),
    }
  })

  const rightSidebarStyle = computed((): CSSProperties => {
    if (['hidden', 'disabled'].includes(state.sidebarRightState))
      return { display: 'none' }
    const { top, height } = sidebarGeometry(
      state.sidebarRightState,
      state.sidebarRightHeaderPriority,
      state.sidebarRightFooterPriority,
    )
    return {
      position: 'fixed',
      right: '0',
      top: `calc(var(--vh, 1vh) * ${top})`,
      width: `${sidebarRightWidth.value}vw`,
      height: `calc(var(--vh, 1vh) * ${height})`,
      zIndex: String(
        sidebarZIndex(
          state.sidebarRightState,
          state.sidebarRightHeaderPriority,
          state.sidebarRightFooterPriority,
        ),
      ),
    }
  })

  const mainContentStyle = computed(
    (): CSSProperties => ({
      position: 'fixed',
      top: `calc(var(--vh, 1vh) * ${contentTopOffset.value})`,
      left: `${sidebarLeftWidth.value}vw`,
      width: `calc(${mainContentWidth.value}vw - ${sidebarLeftWidth.value}vw)`,
      height: `calc(var(--vh, 1vh) * ${mainContentHeight.value})`,
      minHeight: '10vh',
    }),
  )

  // Compat styles (unchanged)
  const cornerPanelStyle = computed(
    (): CSSProperties => ({
      top: `calc(var(--vh, 1vh) * ${contentTopOffset.value})`,
      right: `${sidebarRightWidth.value}vw`,
    }),
  )
  const leftToggleStyle = computed(() => ({
    top: `calc(var(--vh, 1vh) * ${contentTopOffset.value})`,
    left: '0',
  }))
  const rightToggleStyle = computed(() => ({
    top: `calc(var(--vh, 1vh) * ${contentTopOffset.value})`,
    right: '0',
  }))
  const footerToggleStyle = computed(
    (): CSSProperties => ({
      position: 'fixed',
      bottom: '0',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '50',
    }),
  )
  const centerContentStyle = computed((): CSSProperties => {
    const offsetTop = state.showCorner
      ? state.viewportSize === 'mobile'
        ? 8
        : state.viewportSize === 'tablet'
          ? 7
          : 5
      : 0
    return {
      marginTop: `calc(var(--vh, 1vh) * ${offsetTop})`,
      height: `calc(100% - var(--vh, 1vh) * ${offsetTop})`,
    }
  })

  // ─── Visibility helpers ───────────────────────────────────────────────────────

  const leftSidebarVisible = computed(
    () => !['hidden', 'disabled'].includes(state.sidebarLeftState),
  )
  const rightSidebarVisible = computed(
    () => !['hidden', 'disabled'].includes(state.sidebarRightState),
  )

  // ─── Mode labels (size axis only; priority shown separately in UI) ────────────

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

  // ─── Size cycle toggles ──────────────────────────────────────────────────────

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

  // ─── Priority toggles ────────────────────────────────────────────────────────

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

  // ─── Direct state setter (for changeState calls from layout) ─────────────────

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

  // Legacy alias
  function toggleSidebar(side: 'sidebarLeftState' | 'sidebarRightState') {
    if (side === 'sidebarLeftState') toggleLeftSidebar()
    else toggleRightSidebar()
  }

  // ─── Remaining actions (unchanged) ───────────────────────────────────────────

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
    const get = () =>
      section === 'left'
        ? state.showLeft
        : section === 'right'
          ? state.showRight
          : state.showCenter
    const set = (v: boolean) => {
      if (section === 'left') state.showLeft = v
      if (section === 'center') state.showCenter = v
      if (section === 'right') state.showRight = v
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
          state.viewportSize = 'mobile'
          state.isMobileViewport = true
        } else if (width < 1024) {
          state.viewportSize = 'tablet'
          state.isMobileViewport = false
        } else {
          state.viewportSize = 'desktop'
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
      if (!['mobile', 'tablet', 'desktop'].includes(state.viewportSize))
        state.viewportSize = 'desktop'
      if (!['front', 'dash', 'back'].includes(state.SmartState as string))
        state.SmartState = 'front'
    } catch (error) {
      handleError(error, "Couldn't load state.")
    }
  }

  function setSmartState(next: SmartState) {
    state.SmartState = ['front', 'dash', 'back'].includes(next) ? next : 'front'
    saveState()
  }

  function toggleSmartFlip() {
    const order: SmartState[] = ['front', 'dash', 'back']
    const index = order.indexOf(state.SmartState)
    state.SmartState =
      order[(index === -1 ? 0 : index + 1) % order.length] ?? 'front'
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
    // dimensions
    sidebarLeftWidth,
    sidebarRightWidth,
    headerHeight,
    footerHeight,
    sectionPaddingSize,
    mainContentHeight,
    mainContentWidth,
    sidebarContentHeight,
    isLargeViewport,
    // styles
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
    // visibility
    leftSidebarVisible,
    rightSidebarVisible,
    // labels
    headerModeLabel,
    footerModeLabel,
    leftSidebarModeLabel,
    rightSidebarModeLabel,
    // size toggles
    toggleHeader,
    toggleFooter,
    toggleLeftSidebar,
    toggleRightSidebar,
    toggleSidebar,
    changeState,
    // priority toggles
    toggleSidebarLeftHeaderPriority,
    toggleSidebarLeftFooterPriority,
    toggleSidebarRightHeaderPriority,
    toggleSidebarRightFooterPriority,
    // other actions
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
    sidebarGeometry,
    sidebarZIndex,
  }
})

export type {
  EffectId,
  displayModeState,
  displayActionState,
  SmartState,
  ViewportSize,
}
