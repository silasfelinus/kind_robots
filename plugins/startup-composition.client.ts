const ACTIVE_CLASS = 'kr-startup-active'
const FADING_CLASS = 'kr-startup-fading'
const COVER_CLASS = 'kr-full-startup'
const HANDOFF_CLASS = 'kr-startup-handoff'
const EFFECT_READY_CLASS = 'kr-startup-effect-ready'
const CONTROLS_READY_CLASS = 'kr-startup-controls-ready'

export default defineNuxtPlugin((nuxtApp) => {
  const root = document.documentElement
  let sawLoader = false
  let cleanupTimer: number | null = null

  function clearCleanupTimer(): void {
    if (cleanupTimer === null) return
    window.clearTimeout(cleanupTimer)
    cleanupTimer = null
  }

  function cleanup(): void {
    clearCleanupTimer()
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
    }, 700)
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
      root.classList.add(FADING_CLASS)
    }

    if (sawLoader && !loader && !overlay) {
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

  nuxtApp.hook('app:mounted', syncCompositionState)
  window.addEventListener('pagehide', cleanup, { once: true })
})
