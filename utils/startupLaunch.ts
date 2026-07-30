export const FORCE_FULL_STARTUP_KEY = 'kind-robots-force-full-startup-v1'
export const STARTUP_COVER_CLASS = 'kr-full-startup'

export function clearStartupCover(): void {
  if (!import.meta.client) return
  document.documentElement.classList.remove(STARTUP_COVER_CLASS)
}

export function requestFullStartupReload(): void {
  if (!import.meta.client) return

  try {
    sessionStorage.setItem(FORCE_FULL_STARTUP_KEY, '1')
  } catch {
    // Reload anyway; the next visit may fall back to normal startup detection.
  }

  document.documentElement.classList.add(STARTUP_COVER_CLASS)

  let reloadStarted = false
  const reload = () => {
    if (reloadStarted) return
    reloadStarted = true
    window.location.reload()
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(reload)
  })

  window.setTimeout(reload, 180)
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
