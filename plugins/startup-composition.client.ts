import { useButterflyStore } from '@/stores/butterflyStore'
import { useStartupAnimationStore } from '@/stores/startupAnimationStore'

const ACTIVE_CLASS = 'kr-startup-active'
const FADING_CLASS = 'kr-startup-fading'
const COVER_CLASS = 'kr-full-startup'
const HANDOFF_CLASS = 'kr-startup-handoff'
const EFFECT_READY_CLASS = 'kr-startup-effect-ready'
const CONTROLS_READY_CLASS = 'kr-startup-controls-ready'

const EMERGENCY_EXIT_AT_MS = 6000
const FADE_CLEANUP_MS = 700

type StartupCompositionWindow = Window & {
  __KR_STARTUP_SHELL_WATCHDOG__?: number
}

export default defineNuxtPlugin((nuxtApp) => {
  const root = document.documentElement
  const butterflyStore = useButterflyStore()
  const startupStore = useStartupAnimationStore()

  let sawLoader = false
  let cleanupTimer: number | null = null
  let emergencyExitTimer: number | null = null

  function clearCleanupTimer(): void {
    if (cleanupTimer === null) return
    window.clearTimeout(cleanupTimer)
    cleanupTimer = null
  }

  function clearEmergencyExitTimer(): void {
    if (emergencyExitTimer === null) return
    window.clearTimeout(emergencyExitTimer)
    emergencyExitTimer = null
  }

  function clearShellWatchdog(): void {
    const startupWindow = window as StartupCompositionWindow
    const watchdog = startupWindow.__KR_STARTUP_SHELL_WATCHDOG__
    if (typeof watchdog !== 'number') return

    window.clearTimeout(watchdog)
    delete startupWindow.__KR_STARTUP_SHELL_WATCHDOG__
  }

  function beginFade(): void {
    const startupActive =
      root.classList.contains(ACTIVE_CLASS) ||
      root.classList.contains(COVER_CLASS)

    if (!startupActive) return

    clearEmergencyExitTimer()
    root.classList.add(FADING_CLASS)
    butterflyStore.setShowSwarm(false)
  }

  function cleanup(): void {
    clearCleanupTimer()
    clearEmergencyExitTimer()
    clearShellWatchdog()
    butterflyStore.setShowSwarm(false)
    root.classList.remove(
      ACTIVE_CLASS,
      FADING_CLASS,
      COVER_CLASS,
      HANDOFF_CLASS,
      EFFECT_READY_CLASS,
      CONTROLS_READY_CLASS,
    )
  }

  function scheduleCleanup(): void {
    if (cleanupTimer !== null) return

    cleanupTimer = window.setTimeout(() => {
      cleanupTimer = null
      cleanup()
      observer.disconnect()
    }, FADE_CLEANUP_MS)
  }

  function hasUsableImmersiveControls(): boolean {
    return (
      root.classList.contains(CONTROLS_READY_CLASS) &&
      Boolean(document.querySelector('.startup-animation__controls'))
    )
  }

  function requestEmergencyExit(): void {
    if (startupStore.immersive && hasUsableImmersiveControls()) return

    beginFade()
    startupStore.requestExit()
    scheduleCleanup()
  }

  function syncCompositionState(): void {
    if (root.classList.contains(COVER_CLASS)) {
      root.classList.add(ACTIVE_CLASS, HANDOFF_CLASS)
    }

    const loader = document.querySelector('.loader-root')
    const overlay = document.querySelector('.loading-overlay')

    if (loader || overlay) {
      sawLoader = true
      clearCleanupTimer()
    }

    if (overlay?.classList.contains('loading-overlay--fade')) {
      beginFade()
    }

    if (sawLoader && !loader && !overlay) {
      beginFade()
      scheduleCleanup()
    }
  }

  const observer = new MutationObserver(syncCompositionState)

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class'],
  })

  syncCompositionState()

  const elapsedSinceNavigation = performance.now()
  emergencyExitTimer = window.setTimeout(() => {
    emergencyExitTimer = null
    requestEmergencyExit()
  }, Math.max(0, EMERGENCY_EXIT_AT_MS - elapsedSinceNavigation))

  nuxtApp.hook('app:mounted', syncCompositionState)
  window.addEventListener('pagehide', cleanup, { once: true })
})