import { useButterflyStore } from '@/stores/butterflyStore'

const ACTIVE_CLASS = 'kr-startup-active'
const FADING_CLASS = 'kr-startup-fading'
const COVER_CLASS = 'kr-full-startup'
const HANDOFF_CLASS = 'kr-startup-handoff'
const EFFECT_READY_CLASS = 'kr-startup-effect-ready'
const CONTROLS_READY_CLASS = 'kr-startup-controls-ready'

const EMERGENCY_FADE_AT_MS = 6000
const FADE_CLEANUP_MS = 700

export default defineNuxtPlugin((nuxtApp) => {
  const root = document.documentElement
  const butterflyStore = useButterflyStore()

  let sawLoader = false
  let cleanupTimer: number | null = null
  let emergencyFadeTimer: number | null = null

  function clearCleanupTimer(): void {
    if (cleanupTimer === null) return
    window.clearTimeout(cleanupTimer)
    cleanupTimer = null
  }

  function clearEmergencyFadeTimer(): void {
    if (emergencyFadeTimer === null) return
    window.clearTimeout(emergencyFadeTimer)
    emergencyFadeTimer = null
  }

  function beginFade(): void {
    const startupActive =
      root.classList.contains(ACTIVE_CLASS) ||
      root.classList.contains(COVER_CLASS)

    if (!startupActive) return

    clearEmergencyFadeTimer()
    root.classList.add(FADING_CLASS)
    butterflyStore.setShowSwarm(false)
  }

  function cleanup(): void {
    clearCleanupTimer()
    clearEmergencyFadeTimer()
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
  emergencyFadeTimer = window.setTimeout(() => {
    emergencyFadeTimer = null
    beginFade()
  }, Math.max(0, EMERGENCY_FADE_AT_MS - elapsedSinceNavigation))

  nuxtApp.hook('app:mounted', syncCompositionState)
  window.addEventListener('pagehide', cleanup, { once: true })
})