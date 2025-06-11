// /stores/displayStore.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
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
  const headerState = ref<DisplayState>('open')
  const sidebarLeftState = ref<DisplayState>('compact')
  const sidebarRightState = ref<DisplayState>('hidden')
  const footerState = ref<DisplayState>('hidden')
  const isVertical = ref(false)
  const viewportSize = ref<'small' | 'medium' | 'large' | 'extraLarge'>('large')
  const isTouchDevice = ref(false)
  const showTutorial = ref(true)
  const isInitialized = ref(false)
  const flipState = ref<FlipState>('tutorial')
  const isFullScreen = ref(false)
  const isMobileViewport = ref(true)
  const isAnimating = ref(false)
  const currentAnimation = ref('')
  const resizeTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
  const fullscreenState = ref<'nuxt' | 'fullscreen'>('nuxt')
  const bigMode = ref(false)
  const displayMode = ref<displayModeState>('scenario')
  const displayAction = ref<displayActionState>('gallery')
  const previousRoute = ref('')
  const mainComponent = ref('')

  const sidebarLeftWidth = computed(() => {
    const sizes = { small: 16, medium: 11, large: 9, extraLarge: 5 }
    return (
      sizes[viewportSize.value] *
      (['open', 'compact'].includes(sidebarLeftState.value) ? 1 : 0)
    )
  })

  const sidebarRightWidth = computed(() => {
    const sizes = { small: 2, medium: 40, large: 25, extraLarge: 28 }
    return (
      sizes[viewportSize.value] *
      (['open', 'compact'].includes(sidebarRightState.value) ? 1 : 0)
    )
  })

  const headerHeight = computed(() => {
    const sizes = {
      small: bigMode.value ? 10 : 16,
      medium: bigMode.value ? 8 : 14,
      large: bigMode.value ? 7 : 13,
      extraLarge: bigMode.value ? 8 : 14,
    }
    return sizes[viewportSize.value]
  })

  const footerHeight = computed(() => {
    const sizes = { small: 8, medium: 6, large: 7, extraLarge: 6 }
    return sizes[viewportSize.value] * (footerState.value === 'open' ? 1 : 0)
  })

  const sectionPaddingSize = computed(() => {
    const sizes = { small: 1, medium: 1, large: 1, extraLarge: 0.5 }
    return sizes[viewportSize.value]
  })

  const mainContentHeight = computed(
    () => 100 - (headerHeight.value + 2 * sectionPaddingSize.value),
  )

  const mainContentWidth = computed(() => {
    return (
      100 -
      (sidebarRightState.value !== 'hidden'
        ? sidebarRightWidth.value + sectionPaddingSize.value * 2
        : sectionPaddingSize.value)
    )
  })

  const headerStyle = computed(() => ({
    height: `calc(var(--vh) * ${headerHeight.value})`,
    width: `calc(100vw - ${sectionPaddingSize.value * 2}vw)`,
    top: `calc(var(--vh) * ${sectionPaddingSize.value})`,
    left: `${sectionPaddingSize.value}vw`,
  }))

  const leftToggleStyle = computed(() => ({
    top: `calc(var(--vh) * ${headerHeight.value} + ${sectionPaddingSize.value * 2}vh)`,
    left: `${sectionPaddingSize.value}vw`,
  }))

  const rightToggleStyle = computed(() => ({
    top: `calc(var(--vh) * ${headerHeight.value} + ${sectionPaddingSize.value * 2}vh)`,
    right: `${sectionPaddingSize.value}vw`,
  }))

  const footerToggleStyle = computed(() => ({
    bottom: `4vh`,
    left: '50%',
    transform: 'translateX(-50%)',
  }))

  const leftSidebarStyle = computed(() => {
    return sidebarLeftState.value !== 'hidden'
      ? {
          height: `calc(var(--vh) * ${mainContentHeight.value})`,
          width: `${sidebarLeftWidth.value}vw`,
          top: `calc(var(--vh) * ${headerHeight.value} + ${sectionPaddingSize.value * 2}vh)`,
          left: `${sectionPaddingSize.value}vw`,
        }
      : { width: '0px', height: '0px' }
  })

  const rightSidebarStyle = computed(() => {
    return sidebarRightState.value !== 'hidden'
      ? {
          height: `calc(var(--vh) * ${mainContentHeight.value})`,
          width: `${sidebarRightWidth.value}vw`,
          top: `calc(var(--vh) * ${headerHeight.value} + ${sectionPaddingSize.value * 2}vh)`,
          right: `${sectionPaddingSize.value}vw`,
        }
      : { width: '0px', height: '0px' }
  })

  const mainContentStyle = computed(() => ({
    minHeight: `calc(var(--vh) * ${mainContentHeight.value})`,
    maxHeight: '100%',
    width: `calc(${mainContentWidth.value}vw)`,
    top: `calc(var(--vh) * ${headerHeight.value} + ${sectionPaddingSize.value * 2}vh)`,
    right:
      sidebarRightState.value !== 'hidden'
        ? `calc(${sidebarRightWidth.value}vw + ${sectionPaddingSize.value * 2}vw)`
        : `${sectionPaddingSize.value}vw`,
    left: `${sectionPaddingSize.value}vw`,
  }))

  const footerStyle = computed(() => ({ height: '0px', width: '0px' }))

  const isLargeViewport = computed(() =>
    ['large', 'extraLarge'].includes(viewportSize.value),
  )

  function toggleSidebar(side: 'sidebarLeftState' | 'sidebarRightState') {
    const stateMap = {
      hidden: 'compact',
      compact: 'hidden',
      open: 'hidden',
      disabled: 'hidden',
    } as const

    if (side === 'sidebarLeftState') {
      sidebarLeftState.value = stateMap[sidebarLeftState.value]
    } else if (side === 'sidebarRightState') {
      sidebarRightState.value = stateMap[sidebarRightState.value]
    }
    saveState()
  }

  function toggleFooter() {
    footerState.value = footerState.value === 'open' ? 'hidden' : 'open'
  }

  function toggleBigMode() {
    bigMode.value = !bigMode.value
  }

  function setMainComponent(name: string) {
    mainComponent.value = name
  }

  function toggleRandomAnimation() {
    const options = ['sparkle', 'float', 'rainbow', 'shimmer']
    const index = Math.floor(Math.random() * options.length)
    currentAnimation.value = options[index]
    isAnimating.value = true
  }

  function stopAnimation() {
    isAnimating.value = false
    currentAnimation.value = ''
  }

  function initialize() {
    if (isInitialized.value) return
    try {
      loadState()
      updateViewport()
      window.addEventListener('resize', updateViewport)
      isInitialized.value = true
    } catch (error) {
      handleError(error)
    }
  }

  function loadState() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedState = localStorage.getItem('displayStoreState')
        if (savedState) {
          const parsedState = JSON.parse(savedState)
          Object.assign(
            {
              headerState,
              sidebarLeftState,
              sidebarRightState,
              footerState,
              isVertical,
              viewportSize,
              isTouchDevice,
              showTutorial,
              isInitialized,
              flipState,
              isFullScreen,
              isMobileViewport,
              isAnimating,
              currentAnimation,
              fullscreenState,
              bigMode,
              displayMode,
              displayAction,
              previousRoute,
              mainComponent,
            },
            parsedState,
          )
        }
      }
    } catch (error) {
      handleError(error)
    }
  }

  // Function to set the right sidebar state (open/hidden) without toggling compact
  function setSidebarRight(isOpen: boolean) {
    if (isOpen) {
      sidebarRightState.value = 'open'
    } else {
      sidebarRightState.value = 'hidden'
    }
    saveState()
  }

  function handleError(error: unknown) {
    const errorStore = useErrorStore()
    errorStore.setError(ErrorType.GENERAL_ERROR, error)
  }

  function saveState() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stateToSave = {
          headerState: headerState.value,
          sidebarLeftState: sidebarLeftState.value,
          sidebarRightState: sidebarRightState.value,
          footerState: footerState.value,
          isVertical: isVertical.value,
          viewportSize: viewportSize.value,
          isTouchDevice: isTouchDevice.value,
          showTutorial: showTutorial.value,
          flipState: flipState.value,
          isFullScreen: isFullScreen.value,
          isMobileViewport: isMobileViewport.value,
          fullscreenState: fullscreenState.value,
          bigMode: bigMode.value,
          displayMode: displayMode.value,
          displayAction: displayAction.value,
          previousRoute: previousRoute.value,
          mainComponent: mainComponent.value,
        }
        localStorage.setItem('displayStoreState', JSON.stringify(stateToSave))
      }
    } catch (error) {
      handleError(error)
    }
  }

  function updateViewport() {
    if (resizeTimeout.value) clearTimeout(resizeTimeout.value)
    resizeTimeout.value = setTimeout(() => {
      try {
        setCustomVh()
        const width = window.innerWidth
        isVertical.value = window.innerHeight > window.innerWidth
        isTouchDevice.value =
          'ontouchstart' in window || navigator.maxTouchPoints > 0

        if (width < 768) {
          viewportSize.value = 'small'
          isMobileViewport.value = true
          isFullScreen.value = false
        } else if (width < 1024) {
          viewportSize.value = 'medium'
          isMobileViewport.value = false
          isFullScreen.value = false
        } else if (width < 1440) {
          viewportSize.value = 'large'
          isMobileViewport.value = false
          isFullScreen.value = true
        } else {
          viewportSize.value = 'extraLarge'
          isMobileViewport.value = false
          isFullScreen.value = true
        }
      } catch (error) {
        handleError(error)
      } finally {
        resizeTimeout.value = null
      }
    }, 200)
  }

  function toggleAnimationById(id: EffectId) {
    currentAnimation.value = id
    isAnimating.value = true
  }

  function changeState(
    section:
      | 'sidebarLeftState'
      | 'sidebarRightState'
      | 'headerState'
      | 'footerState',
    newState: DisplayState,
  ) {
    const stateMap = {
      sidebarLeftState,
      sidebarRightState,
      headerState,
      footerState,
    }

    stateMap[section].value = newState
    saveState()
  }

  function setAction(action: displayActionState) {
    displayAction.value = action
    saveState()
  }

  function setMode(mode: displayModeState) {
    displayMode.value = mode
    saveState()
  }

  function removeViewportWatcher() {
    console.log('Removing viewport watcher...')
    window.removeEventListener('resize', updateViewport)
  }

  function toggleTutorial() {
    if (flipState.value === 'tutorial' || flipState.value === 'toTutorial') {
      flipState.value = 'toMain'
    } else {
      flipState.value = 'toTutorial'
    }

    // Toggle the showTutorial state
    showTutorial.value = !showTutorial

    saveState()
  }

  return {
    headerState,
    sidebarLeftState,
    sidebarRightState,
    footerState,
    isVertical,
    viewportSize,
    isTouchDevice,
    showTutorial,
    isInitialized,
    flipState,
    isFullScreen,
    isMobileViewport,
    isAnimating,
    currentAnimation,
    resizeTimeout,
    fullscreenState,
    bigMode,
    displayMode,
    displayAction,
    previousRoute,
    mainComponent,
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
    toggleSidebar,
    toggleFooter,
    toggleBigMode,
    setMainComponent,
    toggleRandomAnimation,
    stopAnimation,
    initialize,
    saveState,
    updateViewport,
    toggleAnimationById,
    setSidebarRight,
    setMode,
    setAction,
    toggleTutorial,
    changeState,
    removeViewportWatcher,
  }
})

export type { EffectId, displayModeState, displayActionState }
