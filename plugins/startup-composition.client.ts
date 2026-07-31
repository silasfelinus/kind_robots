import { watch } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'
import { useStartupAnimationStore } from '@/stores/startupAnimationStore'

const ACTIVE_CLASS = 'kr-startup-active'
const FADING_CLASS = 'kr-startup-fading'
const COVER_CLASS = 'kr-full-startup'
const HANDOFF_CLASS = 'kr-startup-handoff'
const EFFECT_READY_CLASS = 'kr-startup-effect-ready'
const CONTROLS_READY_CLASS = 'kr-startup-controls-ready'

const CLIENT_EMERGENCY_AFTER_MOUNT_MS = 9000
const FADE_CLEANUP_MS = 700

type StartupCompositionWindow = Window & {
  __KR_STARTUP_TRACE__?: (name: string, detail?: unknown) => void
  __KR_STARTUP_TRACE_FLUSH__?: (reason: string) => void
  __KR_STARTUP_USER_EXPLORE__?: boolean
}

export default defineNuxtPlugin((nuxtApp) => {
  const root = document.documentElement
  const butterflyStore = useButterflyStore()
  const startupStore = useStartupAnimationStore()
  const startupWindow = window as StartupCompositionWindow

  let sawLoader = false
  let appMounted = false
  let cleanupTimer: number | null = null
  let emergencyExitTimer: number | null = null

  function trace(name: string, detail?: unknown): void {
    startupWindow.__KR_STARTUP_TRACE__?.(name, detail)
  }

  function flush(reason: string): void {
    startupWindow.__KR_STARTUP_TRACE_FLUSH__?.(reason)
  }

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

  function beginFade(reason: string): void {
    const startupActive =
      root.classList.contains(ACTIVE_CLASS) ||
      root.classList.contains(COVER_CLASS)

    trace('client:begin-fade', {
      reason,
      startupActive,
      appMounted,
      immersive: startupStore.immersive,
      controlsActive: startupStore.controlsActive,
      showSwarm: butterflyStore.showSwarm,
    })

    if (!startupActive) return

    clearEmergencyExitTimer()
    root.classList.add(FADING_CLASS)
    butterflyStore.setShowSwarm(false)
  }

  function removeStartupNodes(): void {
    document
      .querySelectorAll(
        '.kr-prehydrate-loader, .kr-startup-black-base, .loading-overlay, .loader-root',
      )
      .forEach((element) => element.remove())
  }

  function cleanup(reason: string): void {
    clearCleanupTimer()
    clearEmergencyExitTimer()
    butterflyStore.setShowSwarm(false)
    startupWindow.__KR_STARTUP_USER_EXPLORE__ = false
    root.classList.remove(
      ACTIVE_CLASS,
      FADING_CLASS,
      COVER_CLASS,
      HANDOFF_CLASS,
      EFFECT_READY_CLASS,
      CONTROLS_READY_CLASS,
    )
    removeStartupNodes()
    trace('client:cleanup', { reason })
    flush('client-cleanup-' + reason)
  }

  function scheduleCleanup(reason: string): void {
    if (cleanupTimer !== null) return

    trace('client:schedule-cleanup', { reason })
    cleanupTimer = window.setTimeout(() => {
      cleanupTimer = null
      cleanup(reason)
    }, FADE_CLEANUP_MS)
  }

  function userDeliberatelyExploring(): boolean {
    return startupWindow.__KR_STARTUP_USER_EXPLORE__ === true
  }

  function requestEmergencyExit(reason: string): void {
    if (userDeliberatelyExploring()) {
      trace('client:emergency-preserved-user-explore', { reason })
      flush('client-emergency-user-explore')
      return
    }

    trace('client:emergency-fire', { reason })
    beginFade(reason)
    startupStore.requestExit()
    scheduleCleanup(reason)
  }

  function syncCompositionState(): void {
    if (root.classList.contains(COVER_CLASS)) {
      root.classList.add(ACTIVE_CLASS, HANDOFF_CLASS)
    }

    const loader = document.querySelector('.loader-root')
    const overlay = document.querySelector('.loading-overlay')

    if (loader || overlay) {
      if (!sawLoader) {
        trace('client:loader-observed', {
          loader: Boolean(loader),
          overlay: Boolean(overlay),
        })
      }
      sawLoader = true
      clearCleanupTimer()
    }

    if (overlay?.classList.contains('loading-overlay--fade')) {
      beginFade('overlay-class')
    }

    if (sawLoader && !loader && !overlay) {
      beginFade('loader-removed')
      scheduleCleanup('loader-removed')
    }
  }

  function handleStartupControlClick(event: Event): void {
    const target = event.target
    if (!(target instanceof Element)) return

    const button = target.closest<HTMLButtonElement>(
      '.startup-animation__controls button',
    )
    if (!button) return

    const description = [
      button.getAttribute('title'),
      button.getAttribute('aria-label'),
      button.textContent,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    if (description.includes('pause') || description.includes('explore')) {
      startupWindow.__KR_STARTUP_USER_EXPLORE__ = true
      trace('client:user-entered-explore')
      flush('user-entered-explore')
      return
    }

    if (
      description.includes('resume') ||
      description.includes('leave startup') ||
      description.includes('close')
    ) {
      startupWindow.__KR_STARTUP_USER_EXPLORE__ = false
      trace('client:user-left-explore')
    }
  }

  const observer = new MutationObserver(syncCompositionState)

  /*
   * Scoped deliberately. This previously observed the whole document with
   * `subtree: true` for both childList and class attributes, so every class
   * toggle anywhere in the app re-ran syncCompositionState (which does four
   * querySelector calls) — thousands of callbacks during hydration, competing
   * with the very timers and click handlers the startup sequence depends on.
   *
   * All the state we actually care about lives in exactly two places: the
   * startup classes on <html>, and the loader nodes being added/removed as
   * direct children of <body> / the app root.
   */
  observer.observe(document.documentElement, {
    childList: false,
    attributes: true,
    attributeFilter: ['class'],
  })

  /*
   * Teardown is driven by the store rather than by watching the DOM for the
   * loader nodes disappearing. showSwarm going false is the authoritative
   * "startup is over" signal (kind-loader sets it in handleOverlayHiding and
   * on unmount), so we no longer need a subtree childList observer to infer it.
   */
  watch(
    () => butterflyStore.showSwarm,
    (visible, wasVisible) => {
      if (visible || !wasVisible) return
      beginFade('swarm-cleared')
      scheduleCleanup('swarm-cleared')
    },
  )

  document.addEventListener('click', handleStartupControlClick, true)

  trace('client:plugin-init', {
    performanceNow: Math.round(performance.now()),
    startupActive:
      root.classList.contains(ACTIVE_CLASS) ||
      root.classList.contains(COVER_CLASS),
  })
  syncCompositionState()

  nuxtApp.hook('app:mounted', () => {
    appMounted = true
    trace('client:app-mounted')
    syncCompositionState()

    clearEmergencyExitTimer()
    emergencyExitTimer = window.setTimeout(() => {
      emergencyExitTimer = null
      requestEmergencyExit('client-post-mount-watchdog')
    }, CLIENT_EMERGENCY_AFTER_MOUNT_MS)
  })

  window.addEventListener(
    'pagehide',
    () => {
      trace('client:pagehide')
      flush('client-pagehide')
      clearCleanupTimer()
      clearEmergencyExitTimer()
      observer.disconnect()
      document.removeEventListener('click', handleStartupControlClick, true)
    },
    { once: true },
  )
})
