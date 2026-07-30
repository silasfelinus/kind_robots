export const FORCE_FULL_STARTUP_KEY = 'kind-robots-force-full-startup-v1'

export function requestFullStartupReload(): void {
  if (!import.meta.client) return

  try {
    sessionStorage.setItem(FORCE_FULL_STARTUP_KEY, '1')
  } catch {
    // Reload anyway; the next visit may fall back to normal startup detection.
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
