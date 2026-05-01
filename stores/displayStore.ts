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
  'dream',
] as const

type FooterComponentName = (typeof footerComponentNames)[number]
type PromptOffsetOwner = FooterComponentName | ''

type SidebarDirection = 'forward' | 'backward'

type FooterStage = 'hidden' | 'compact' | 'open' | 'priority' | 'disabled'

export const useDisplayStore = defineStore('displayStore', () => {
  const state = reactive({
    headerState: 'open' as DisplayState,
    sidebarLeftState: 'hidden' as DisplayState,
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

  const bottomControlRowVisible = computed(() => {
    return footerStage.value !== 'disabled'
  })

  const bottomControlCount = 5
  const bottomControlGap = computed(() => {
    const sizes: Record<ViewportSize, number> = {
      small: 1,
      medium: 1,
      large: 0.75,
      extraLarge: 0.75,
    }

    return sizes[state.viewportSize]
  })

  const bottomControlRowBottom = computed(() => {
    return footerControlBottom.value
  })

  const bottomControlRowHeight = computed(() => {
    if (!bottomControlRowVisible.value) return 0

    return (
      bottomControlHeight.value +
      footerControlBottom.value +
      sectionPaddingSize.value
    )
  })

  function getBottomControlStyle(
    index: number,
    total = bottomControlCount,
  ): CSSProperties {
    const leftInset = footerWallInset.value
    const rightInset = footerWallInset.value
    const gap = bottomControlGap.value
    const totalGap = gap * (total - 1)
    const availableWidth = 100 - leftInset - rightInset - totalGap
    const slotWidth = availableWidth / total
    const left = leftInset + index * (slotWidth + gap)

    return {
      position: 'fixed',
      left: `${left}vw`,
      bottom: `calc(var(--vh) * ${bottomControlRowBottom.value})`,
      width: `${slotWidth}vw`,
      height: `calc(var(--vh) * ${bottomControlHeight.value})`,
      zIndex: '30',
    }
  }

  const footerPanelHeight = computed(() => {
    if (!footerContentVisible.value) return 0
    return footerHeight.value + promptOffset.value
  })

  const effectiveFooterHeight = computed(() => {
    return footerPanelHeight.value + bottomControlRowHeight.value
  })

  const contentBottomOffset = computed(() => {
    return effectiveFooterHeight.value + sectionPaddingSize.value
  })

  const mainPanelHeight = computed(() => {
    return 100 - mainPanelTopOffset.value - contentBottomOffset.value
  })

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
    return 100 - sectionPaddingSize.value * 2 - bottomControlRowHeight.value
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
      small: 14,
      medium: 13,
      large: 12,
      extraLarge: 13,
    }

    return sizes[state.viewportSize]
  })

  const footerLayout: Record<FooterStage, Record<ViewportSize, number>> = {
    hidden: {
      small: 7,
      medium: 6,
      large: 5,
      extraLarge: 5,
    },
    compact: {
      small: 16,
      medium: 12,
      large: 10,
      extraLarge: 8,
    },
    open: {
      small: 22,
      medium: 18,
      large: 24,
      extraLarge: 18,
    },
    priority: {
      small: 50,
      medium: 50,
      large: 50,
      extraLarge: 50,
    },
    disabled: {
      small: 0,
      medium: 0,
      large: 0,
      extraLarge: 0,
    },
  }

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

  const footerContentVisible = computed(() => {
    return footerStage.value !== 'hidden' && footerStage.value !== 'disabled'
  })

  const footerHeight = computed(() => {
    return footerLayout[footerStage.value][state.viewportSize]
  })

  const footerControlBottom = computed(() => {
    return sectionPaddingSize.value * 0.35
  })

  const footerWallInset = computed(() => {
    return Math.max(0.15, sectionPaddingSize.value * 0.25)
  })

  const bottomControlHeight = computed(() => {
    const sizes: Record<FooterStage, Record<ViewportSize, number>> = {
      hidden: {
        small: 6.5,
        medium: 4,
        large: 3,
        extraLarge: 3,
      },
      compact: {
        small: 6.5,
        medium: 6,
        large: 5,
        extraLarge: 4.5,
      },
      open: {
        small: 6.5,
        medium: 5.5,
        large: 5,
        extraLarge: 4.5,
      },
      priority: {
        small: 6.5,
        medium: 5.5,
        large: 5,
        extraLarge: 4.5,
      },
      disabled: {
        small: 0,
        medium: 0,
        large: 0,
        extraLarge: 0,
      },
    }

    const requestedHeight = sizes[footerStage.value][state.viewportSize]

    if (state.viewportSize === 'small') return requestedHeight
    if (footerStage.value === 'hidden') return requestedHeight

    const maxFooterHeight = Math.max(
      0,
      footerHeight.value + promptOffset.value - footerControlBottom.value,
    )

    return Math.min(requestedHeight, maxFooterHeight)
  })

  const sidebarContentHeight = computed(() => {
    const padding = sectionPaddingSize.value
    const headerExists = state.headerState !== 'hidden'
    const header = headerExists ? headerHeight.value : 0
    const headerPadding = headerExists ? padding * 2 : padding

    return 100 - (header + headerPadding + contentBottomOffset.value)
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
    return Math.max(0, 100 - headerLeftInset.value - headerRightInset.value)
  })

  const footerLeftInset = computed(() => {
    return sectionPaddingSize.value
  })

  const footerRightInset = computed(() => {
    return sectionPaddingSize.value
  })

  const footerWidth = computed(() => {
    return Math.max(0, 100 - footerLeftInset.value - footerRightInset.value)
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

  const headerToggleStyle = computed<CSSProperties>(() => ({
    position: 'fixed',
    top: `calc(var(--vh) * ${Math.max(0.5, sectionPaddingSize.value + 0.75)})`,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '30',
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
    right: `calc(${sectionPaddingSize.value}vw + 0.5rem)`,
    transform: 'translateY(-50%)',
    zIndex: '30',
  }))

  const rightSidebarForwardToggleStyle = computed<CSSProperties>(() => ({
    position: 'fixed',
    top: rightToggleStyle.value.top,
    right: `calc(${sectionPaddingSize.value + sidebarRightWidth.value}vw - 0.5rem)`,
    transform: 'translate(100%, -50%)',
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
      state.showCorner &&
      (state.sidebarRightState === 'open' ||
        state.sidebarRightState === 'priority')
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

  const footerStyle = computed<CSSProperties>(() => {
    if (!footerContentVisible.value) {
      return {
        top: '100vh',
        left: `${footerLeftInset.value}vw`,
        width: `${footerWidth.value}vw`,
        height: '0px',
        opacity: '0',
        pointerEvents: 'none',
      }
    }

    return {
      top: `calc(var(--vh) * ${
        100 -
        footerPanelHeight.value -
        bottomControlRowHeight.value -
        sectionPaddingSize.value
      })`,
      left: `${footerLeftInset.value}vw`,
      width: `${footerWidth.value}vw`,
      height: `calc(var(--vh) * ${footerPanelHeight.value})`,
      opacity: '1',
      pointerEvents: 'auto',
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
    const order: SidebarStage[] = ['hidden', 'open', 'priority']
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

  function applyViewportSize() {
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
      handleError(error, 'Viewport update failed')
    }
  }

  function updateViewport() {
    if (resizeTimeout.value) clearTimeout(resizeTimeout.value)

    resizeTimeout.value = setTimeout(() => {
      applyViewportSize()
      resizeTimeout.value = null
    }, 80)
  }

  function removeViewportWatcher() {
    window.removeEventListener('resize', updateViewport)
    window.removeEventListener('orientationchange', updateViewport)
    window.visualViewport?.removeEventListener('resize', updateViewport)
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
        applyViewportSize()

        window.addEventListener('resize', updateViewport)
        window.addEventListener('orientationchange', updateViewport)

        window.visualViewport?.addEventListener('resize', updateViewport)

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
    leftSidebarBackToggleStyle,
    leftSidebarForwardToggleStyle,
    rightSidebarBackToggleStyle,
    rightSidebarForwardToggleStyle,
    footerStage,
    footerContentVisible,
    footerControlBottom,
    footerWallInset,
    bottomControlHeight,
    mainPanelHeight,
    footerPanelHeight,
    bottomControlRowVisible,
    bottomControlRowBottom,
    bottomControlRowHeight,
    getBottomControlStyle,
    applyViewportSize,
  }
})

export type { EffectId, displayModeState, displayActionState, SmartState }
