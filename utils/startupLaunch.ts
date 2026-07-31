export const FORCE_FULL_STARTUP_KEY = 'kind-robots-force-full-startup-v1'
export const APP_READY_CLASS = 'kr-app-ready'

/*
 * Marks the app as mounted so the server-rendered boot cover retires early.
 *
 * The cover releases itself through a CSS animation regardless, so this is an
 * optimisation, never a requirement — if this never runs, the cover still
 * clears on its own. That is the whole point of the current design: nothing
 * about revealing the site depends on JavaScript succeeding.
 */
export function markAppReady(): void {
  if (!import.meta.client) return
  document.documentElement.classList.add(APP_READY_CLASS)
}

export function requestFullStartupReload(): void {
  if (!import.meta.client) return

  try {
    sessionStorage.setItem(FORCE_FULL_STARTUP_KEY, '1')
  } catch {
    // Reload anyway; the next visit falls back to normal startup detection.
  }

  window.location.reload()
}

export function consumeForcedFullStartup(): boolean {
  if (!import.meta.client) return false

  try {
    const forced = sessionStorage.getItem(FORCE_FULL_STARTUP_KEY) === '1'
    sessionStorage.removeItem(FORCE_FULL_STARTUP_KEY)
    return forced
  } catch {
    return false
  }
}

export function isBrowserReload(): boolean {
  if (!import.meta.client) return false

  const navigation = performance.getEntriesByType(
    'navigation',
  )[0] as PerformanceNavigationTiming | undefined

  return navigation?.type === 'reload'
}
