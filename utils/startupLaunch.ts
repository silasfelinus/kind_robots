export const FORCE_FULL_STARTUP_KEY = 'kind-robots-force-full-startup-v1'
export const APP_READY_CLASS = 'kr-app-ready'

export const BOOT_COVER_SELECTOR = '.kr-boot-cover'

/*
 * Marks the app as mounted so the server-rendered boot cover retires early.
 *
 * The cover releases itself through a CSS animation regardless, so the CLASS
 * half of this is an optimisation, never a requirement — if this never runs,
 * the cover still clears on its own. That is the whole point of the current
 * design: nothing about revealing the site depends on JavaScript succeeding.
 *
 * BUT THE NODE REMOVAL IS NOT AN OPTIMISATION. Silas, 2026-08-09, on /bots:
 * the cover was still on screen after the app had loaded, rendered UNSTYLED
 * and in normal document flow — its title in the page's own serif on the page's
 * own background rather than white-on-black, and the app pushed down below it
 * instead of covered by it. Every escape the cover has (the release keyframe,
 * the `html.kr-app-ready` rule) lives in the same inline <style> block that
 * positions it, so if that block does not take effect the element is not merely
 * mis-positioned — it is permanent, because the rules that would hide it are
 * gone too. Nothing in the app removed it: `markAppReady` only added a class.
 *
 * The served HTML is correct (verified against production: `<body>` → the
 * <style> → the cover, with `position: fixed` and a 6s release), so why that
 * block did not apply in that session is NOT explained. This does not pretend
 * to explain it — it removes the shared dependency, so a cover whose styles
 * fail for any reason still cannot outlive the app that replaced it.
 */
export function retireBootCover(): void {
  if (!import.meta.client) return

  document
    .querySelectorAll(BOOT_COVER_SELECTOR)
    .forEach((element) => element.remove())
}

export function markAppReady(): void {
  if (!import.meta.client) return
  document.documentElement.classList.add(APP_READY_CLASS)
  retireBootCover()
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

  const navigation = performance.getEntriesByType('navigation')[0] as
    PerformanceNavigationTiming | undefined

  return navigation?.type === 'reload'
}
