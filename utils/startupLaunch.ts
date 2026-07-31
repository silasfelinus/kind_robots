export const FORCE_FULL_STARTUP_KEY = 'kind-robots-force-full-startup-v1'
export const STARTUP_COVER_CLASS = 'kr-full-startup'
export const STARTUP_STARTED_AT_KEY = 'kind-robots-startup-started-at-v1'

const MAX_STARTUP_AGE_MS = 30_000

export function clearStartupCover(): void {
  if (!import.meta.client) return
  document.documentElement.classList.remove(STARTUP_COVER_CLASS)
}

export function requestFullStartupReload(): void {
  if (!import.meta.client) return

  try {
    sessionStorage.setItem(FORCE_FULL_STARTUP_KEY, '1')
    sessionStorage.setItem(STARTUP_STARTED_AT_KEY, String(Date.now()))
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

export function consumeStartupStartedAt(): number {
  const now = Date.now()
  if (!import.meta.client) return now

  const navigationStartedAt = Number(performance.timeOrigin)
  const fallback = Number.isFinite(navigationStartedAt)
    ? navigationStartedAt
    : now

  try {
    const raw = sessionStorage.getItem(STARTUP_STARTED_AT_KEY)
    sessionStorage.removeItem(STARTUP_STARTED_AT_KEY)
    const startedAt = Number(raw)
    const age = now - startedAt

    if (Number.isFinite(startedAt) && age >= 0 && age <= MAX_STARTUP_AGE_MS) {
      return startedAt
    }
  } catch {
    return fallback
  }

  return fallback
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

/*
 * True once the server-rendered startup shell has given up on this page load
 * (its watchdog fired, or the user pressed exit/resume before hydration).
 *
 * Set in server/plugins/00-startup-composition-shell.ts. The app can hydrate
 * seconds after that happens on a slow device, and starting a second startup
 * sequence at that point leaves it running with no watchdog and no CSS hard
 * stop, because both are gated on classes the shell already removed.
 */
export function startupWasAbandoned(): boolean {
  if (!import.meta.client) return false

  return (
    (window as Window & { __KR_STARTUP_ABANDONED__?: boolean })
      .__KR_STARTUP_ABANDONED__ === true
  )
}

export function isBrowserReload(): boolean {
  if (!import.meta.client) return false

  const navigation = performance.getEntriesByType(
    'navigation',
  )[0] as PerformanceNavigationTiming | undefined

  return navigation?.type === 'reload'
}
