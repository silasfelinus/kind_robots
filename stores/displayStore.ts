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
const footerComponentNames = [
  'fx',
  'kind',
  'art',
  'story',
  'theme',
  'user',
  'lab',
  'brainstorm',
  'giftshop',
] as const

type FooterComponentName = (typeof footerComponentNames)[number]
type PromptOffsetOwner = FooterComponentName | ''

type SidebarDirection = 'forward' | 'backward'

type FooterStage = 'hidden' | 'compact' | 'open' | 'priority' | 'disabled'

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
    showCorner: true,
    SmartState: 'front' as SmartState,
  })

  const resizeTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

  const footerComponent = ref<FooterComponentName>('fx')
  const promptOffset = ref(0)
  const promptOffsetOwner = ref<PromptOffsetOwner>('')

  function normalizeSidebarState(value: DisplayState): SidebarStage {
    if (value === 'hidden') return 'hidden'
    if (value === 'compact') return 'compact'
    if (value === 'priority') return 'priority'
    return 'open'
  }

  function normalizeFooterComponent(value: string): FooterComponentName {
    return footerComponentNames.includes(value as FooterComponentName)
      ? (value as FooterComponentName)
      : 'kind'
  }

  function normalizeFooterState(value: DisplayState): FooterStage {
    if (value === 'hidden') return 'hidden'
    if (value === 'compact') return 'compact'
    if (value === 'open') return 'open'
    if (value === 'priority') return 'priority'
    if (value === 'disabled') return 'disabled'
    return 'hidden'
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
    const padding = sectionPaddingSize.value
    const header = state.headerState === 'hidden' ? 0 : headerHeight.value
    return header + padding
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

  const footerLayout = {
    hidden: {
      small: { height: 7, control: 7 },
      medium: { height: 6, control: 6 },
      large: { height: 5, control: 5 },
      extraLarge: { height: 5, control: 5 },
    },
    compact: {
      small: { height: 16, control: 7 },
      medium: { height: 12, control: 6 },
      large: { height: 10, control: 5 },
      extraLarge: { height: 8, control: 5 },
    },
    open: {
      small: { height: 22, control: 8 },
      medium: { height: 18, control: 7 },
      large: { height: 24, control: 6 },
      extraLarge: { height: 18, control: 6 },
    },
    priority: {
      small: { height: 50, control: 9 },
      medium: { height: 50, control: 8 },
      large: { height: 50, control: 7 },
      extraLarge: { height: 50, control: 7 },
    },
    disabled: {
      small: { height: 0, control: 0 },
      medium: { height: 0, control: 0 },
      large: { height: 0, control: 0 },
      extraLarge: { height: 0, control: 0 },
    },
  } as const

  const sectionPaddingSize = computed(() => {
    const sizes: Record<ViewportSize, number> = {
      small: 0.5,
      medium: 0.5,
      large: 1,
      extraLarge: 1,
    }

    return sizes[state.viewportSize]
  })

  const footerStage = computed<FooterStage>(() => {
    return normalizeFooterState(state.footerState)
  })

  const footerSpaceReserved = computed(() => {
    return footerStage.value !== 'disabled'
  })

  const footerContentVisible = computed(() => {
    return footerStage.value !== 'hidden' && footerStage.value !== 'disabled'
  })

  const footerHeight = computed(() => {
    return footerLayout[footerStage.value][state.viewportSize].height
  })

  const footerControlSize = computed(() => {
    return footerLayout[footerStage.value][state.viewportSize].control
  })

  const effectiveFooterHeight = computed(() => {
    if (!footerSpaceReserved.value) return 0
    return footerHeight.value + promptOffset.value
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
    const footer = footerSpaceReserved.value ? effectiveFooterHeight.value : 0
    const paddingTotal = footerSpaceReserved.value ? padding : 0
    return footer + paddingTotal
  })

  const sidebarContentHeight = computed(() => {
    const padding = sectionPaddingSize.value
    const headerExists = state.headerState !== 'hidden'
    const header = headerExists ? headerHeight.value : 0
    const headerPadding = headerExists ? padding * 2 : padding

    return 100 - (header + headerPadding + contentBottomOffset.value)
  })

  const mainPanelHeight = computed(() => {
    const bottom = footerSpaceReserved.value
      ? effectiveFooterHeight.value + sectionPaddingSize.value
      : sectionPaddingSize.value

    return 100 - mainPanelTopOffset.value - bottom
  })

  const mainContentLeft = computed(() => {
    const padding = sectionPaddingSize.value
    return sidebarLeftVisible.value ? sidebarLeftWidth.value + padding : padding
  })

  const mainContentRightInset = computed(() => {
    const padding = sectionPaddingSize.value
    return sidebarRightVisible.value
      ? sidebarRightWidth.value + padding
      : padding
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
    const padding = sectionPaddingSize.value
    const header = state.headerState === 'hidden' ? 0 : headerHeight.value

    const isHidden = leftSidebarStage.value === 'hidden'
    const isPriority = leftSidebarStage.value === 'priority'

    const sidebarTop = isPriority
      ? fullColumnTopOffset.value
      : header + padding * 2

    const seam = isHidden ? padding : padding + sidebarLeftWidth.value

    return {
      position: 'fixed',
      top: `calc(var(--vh) * ${sidebarTop + sidebarContentHeight.value / 2})`,
      left: `${seam}vw`,
      transform: 'translate(-50%, -50%)',
      zIndex: '30',
    }
  })

  const rightToggleStyle = computed<CSSProperties>(() => {
    const padding = sectionPaddingSize.value
    const header = state.headerState === 'hidden' ? 0 : headerHeight.value

    const isHidden = rightSidebarStage.value === 'hidden'
    const isPriority = rightSidebarStage.value === 'priority'

    const sidebarTop = isPriority
      ? fullColumnTopOffset.value
      : header + padding * 2

    const seam = isHidden ? padding : padding + sidebarRightWidth.value

    return {
      position: 'fixed',
      top: `calc(var(--vh) * ${sidebarTop + sidebarContentHeight.value / 2})`,
      right: `${seam}vw`,
      transform: 'translate(50%, -50%)',
      zIndex: '30',
    }
  })

  const headerToggleStyle = computed<CSSProperties>(() => ({
    position: 'fixed',
    top: `calc(var(--vh) * ${Math.max(0.5, sectionPaddingSize.value + 0.75)})`,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '30',
  }))

  const footerToggleHeight = computed(() => {
    const sizes: Record<FooterStage, Record<ViewportSize, number>> = {
      hidden: {
        small: 3,
        medium: 2.5,
        large: 2,
        extraLarge: 2,
      },
      compact: {
        small: 2.5,
        medium: 2.25,
        large: 1.8,
        extraLarge: 1.8,
      },
      open: {
        small: 2.25,
        medium: 2,
        large: 1.6,
        extraLarge: 1.6,
      },
      priority: {
        small: 2,
        medium: 1.8,
        large: 1.5,
        extraLarge: 1.5,
      },
      disabled: {
        small: 0,
        medium: 0,
        large: 0,
        extraLarge: 0,
      },
    }

    return sizes[footerStage.value][state.viewportSize]
  })

  const footerToggleWidth = computed(() => {
    return footerControlSize.value * 1.8
  })

  const footerControlBottom = computed(() => {
    return sectionPaddingSize.value
  })

  const smallToggleHeight = computed(() => footerControlSize.value * 0.4)

  const sidebarToggleBottom = computed(
    () => footerControlBottom.value + smallToggleHeight.value,
  )

  const stackTopVh = computed(
    () => sidebarToggleBottom.value + smallToggleHeight.value,
  )

  const footerToggleBottom = computed(() => {
    if (footerStage.value === 'hidden') {
      return sectionPaddingSize.value + 5
    }

    if (footerStage.value === 'compact') {
      return stackTopVh.value
    }

    return Math.max(
      stackTopVh.value,
      effectiveFooterHeight.value -
        footerToggleHeight.value -
        sectionPaddingSize.value * 0.35,
    )
  })

  const footerControlBaseStyle = computed<CSSProperties>(() => ({
    position: 'fixed',
    width: `${footerControlSize.value}vw`,
    height: `calc(var(--vh) * ${smallToggleHeight.value})`,
    bottom: `calc(var(--vh) * ${footerControlBottom.value})`,
    zIndex: '30',
  }))

  const leftCornerToggleStyle = computed<CSSProperties>(() => ({
    ...footerControlBaseStyle.value,
    left: `${sectionPaddingSize.value}vw`,
  }))

  const leftFooterToggleStyle = computed<CSSProperties>(() => ({
    position: 'fixed',
    width: `${footerControlSize.value}vw`,
    height: `calc(var(--vh) * ${smallToggleHeight.value})`,
    bottom: `calc(var(--vh) * ${sidebarToggleBottom.value})`,
    left: `${sectionPaddingSize.value}vw`,
    zIndex: '30',
  }))

  const footerToggleStyle = computed<CSSProperties>(() => ({
    position: 'fixed',
    width: `${footerToggleWidth.value}vw`,
    height: `calc(var(--vh) * ${footerToggleHeight.value})`,
    left: '50vw',
    bottom: `calc(var(--vh) * ${footerToggleBottom.value})`,
    transform: 'translateX(-50%)',
    zIndex: '30',
  }))

  const rightFooterToggleStyle = computed<CSSProperties>(() => ({
    position: 'fixed',
    width: `${footerControlSize.value}vw`,
    height: `calc(var(--vh) * ${smallToggleHeight.value})`,
    bottom: `calc(var(--vh) * ${sidebarToggleBottom.value})`,
    right: `${sectionPaddingSize.value}vw`,
    zIndex: '30',
  }))

  const rightCornerToggleStyle = computed<CSSProperties>(() => ({
    ...footerControlBaseStyle.value,
    right: `${sectionPaddingSize.value}vw`,
  }))

  const leftSidebarBackToggleStyle = computed<CSSProperties>(() => ({
    position: 'fixed',
    top: leftToggleStyle.value.top,
    left: `calc(${sectionPaddingSize.value}vw + 0.5rem)`,
    transform: 'translateY(-50%)',
    zIndex: '30',
  }))

  const leftSidebarForwardToggleStyle = computed<CSSProperties>(() => ({
    position: 'fixed',
    top: leftToggleStyle.value.top,
    left: `calc(${sectionPaddingSize.value + sidebarLeftWidth.value}vw - 0.5rem)`,
    transform: 'translate(-100%, -50%)',
    zIndex: '30',
  }))

  const rightSidebarBackToggleStyle = computed<CSSProperties>(() => ({
    position: 'fixed',
    top: rightToggleStyle.value.top,
    right: `calc(${sectionPaddingSize.value + sidebarRightWidth.value}vw - 0.5rem)`,
    transform: 'translate(100%, -50%)',
    zIndex: '30',
  }))

  const rightSidebarForwardToggleStyle = computed<CSSProperties>(() => ({
    position: 'fixed',
    top: rightToggleStyle.value.top,
    right: `calc(${sectionPaddingSize.value}vw + 0.5rem)`,
    transform: 'translateY(-50%)',
    zIndex: '30',
  }))

  const cornerPanelStyle = computed<CSSProperties>(() => {
    const padding = sectionPaddingSize.value
    const header = state.headerState === 'hidden' ? 0 : headerHeight.value
    const topOffset = rightSidebarPriority.value
      ? fullColumnTopOffset.value
      : header + padding * 2

    return {
      position: 'fixed',
      top: `calc(var(--vh) * ${topOffset})`,
      right: `calc(${padding}vw + 0.75rem)`,
      left: 'auto',
      width: 'max-content',
      zIndex: '30',
    }
  })

  const showCornerPanel = computed(() => {
    return (
      state.sidebarRightState === 'open' ||
      state.sidebarRightState === 'priority'
    )
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
    const padding = sectionPaddingSize.value
    const isHidden = state.headerState === 'hidden'

    if (state.bigMode) {
      return {
        height: isHidden ? '0px' : `calc(var(--vh) * ${headerHeight.value})`,
        width: `calc(100vw - ${padding * 2}vw)`,
        top: `calc(var(--vh) * ${padding})`,
        left: `${padding}vw`,
        opacity: isHidden ? '0' : '1',
        pointerEvents: isHidden ? 'none' : 'auto',
      }
    }

    return {
      height: isHidden ? '0px' : `calc(var(--vh) * ${headerHeight.value})`,
      width: `${headerWidth.value}vw`,
      top: `calc(var(--vh) * ${padding})`,
      left: `${headerLeftInset.value}vw`,
      opacity: isHidden ? '0' : '1',
      pointerEvents: isHidden ? 'none' : 'auto',
    }
  })

  const mainContentStyle = computed<CSSProperties>(() => {
    return {
      top: `calc(var(--vh) * ${mainPanelTopOffset.value})`,
      left: `${mainContentLeft.value}vw`,
      width: `${mainContentWidth.value}vw`,
      height: `calc(var(--vh) * ${mainPanelHeight.value})`,
      minHeight: '10vh',
    }
  })

  const footerStyle = computed<CSSProperties>(() => ({
    top: `calc(var(--vh) * ${100 - effectiveFooterHeight.value - sectionPaddingSize.value})`,
    left: `${footerLeftInset.value}vw`,
    width: `${footerWidth.value}vw`,
    height: `calc(var(--vh) * ${effectiveFooterHeight.value})`,
    opacity: footerContentVisible.value ? '1' : '0',
    pointerEvents: footerContentVisible.value ? 'auto' : 'none',
  }))

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

  function requestPromptOffset(owner: FooterComponentName, nextOffset: number) {
    if (footerComponent.value !== owner) return

    const clamped = Math.max(0, Math.min(nextOffset, 24))
    promptOffset.value = clamped
    promptOffsetOwner.value = clamped > 0 ? owner : ''
  }

  function clearPromptOffset(owner?: FooterComponentName) {
    if (owner && promptOffsetOwner.value && promptOffsetOwner.value !== owner) {
      return
    }

    promptOffset.value = 0
    promptOffsetOwner.value = ''
  }

  function refreshPromptOffset(
    owner: FooterComponentName,
    scrollHeight: number,
    clientHeight: number,
    extraPadding = 2,
  ) {
    if (footerComponent.value !== owner) {
      clearPromptOffset(owner)
      return
    }

    const overflow = Math.max(0, scrollHeight - clientHeight)
    const overflowVh =
      window.innerHeight > 0 ? (overflow / window.innerHeight) * 100 : 0

    requestPromptOffset(owner, overflowVh + extraPadding)
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

  function getNextSidebarStage(
    current: SidebarStage,
    direction: SidebarDirection,
  ) {
    const order: SidebarStage[] = ['hidden', 'compact', 'open', 'priority']
    const index = order.indexOf(current)

    if (direction === 'backward') {
      return order[(index - 1 + order.length) % order.length] ?? 'hidden'
    }

    return order[(index + 1) % order.length] ?? 'hidden'
  }

  function toggleSidebar(
    side: SidebarStateKey,
    direction: SidebarDirection = 'forward',
  ) {
    const logical: LogicalSide = side === 'sidebarLeftState' ? 'left' : 'right'
    const current = getSidebarStage(logical)
    const next = getNextSidebarStage(current, direction)

    setSidebarStage(logical, next)
    saveState()
  }

  function toggleLeftSidebar(direction: SidebarDirection = 'forward') {
    toggleSidebar('sidebarLeftState', direction)
  }

  function toggleRightSidebar(direction: SidebarDirection = 'forward') {
    toggleSidebar('sidebarRightState', direction)
  }

  function toggleFooter() {
    const order: DisplayState[] = ['compact', 'open', 'priority', 'hidden']
    const currentIndex = order.indexOf(state.footerState)
    state.footerState = order[(currentIndex + 1) % order.length] ?? 'compact'
    clearPromptOffset()
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

    if (section === 'footerState') {
      state.footerState = normalizeFooterState(newState) as DisplayState
      clearPromptOffset()
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

      state.footerState = normalizeFooterState(
        state.footerState,
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

  function setFooterComponent(name: string) {
    const normalized = normalizeFooterComponent(name)
    footerComponent.value = normalized
    clearPromptOffset()
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
    effectiveFooterHeight,
    sectionPaddingSize,
    sidebarContentHeight,
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
    footerStyle,
    footerComponent,
    promptOffset,
    promptOffsetOwner,

    isLargeViewport,
    headerModeLabel,
    footerModeLabel,
    leftSidebarModeLabel,
    rightSidebarModeLabel,
    setFooterComponent,
    requestPromptOffset,
    clearPromptOffset,
    refreshPromptOffset,

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
    showCornerPanel,
    footerComponentNames,
    leftCornerToggleStyle,
    rightCornerToggleStyle,
    leftFooterToggleStyle,
    rightFooterToggleStyle,
    leftSidebarBackToggleStyle,
    leftSidebarForwardToggleStyle,
    rightSidebarBackToggleStyle,
    rightSidebarForwardToggleStyle,
    footerStage,
    footerControlSize,
    footerSpaceReserved,
    footerContentVisible,
    footerToggleHeight,
    footerToggleWidth,
    footerControlBottom,
    footerToggleBottom,
  }
})

export type { EffectId, displayModeState, displayActionState, SmartState }
