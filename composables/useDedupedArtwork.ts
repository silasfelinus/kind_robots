// /composables/useDedupedArtwork.ts
//
// interface-vision/t-108: /navigation renders ~85 dashboard-tab icons, and
// many distinct entries resolve to the exact same image path (five separate
// content files can share one dashboardKey/dashboardTab pair). Mounting that
// many identical-src <img> tags in the same tick fires that many simultaneous
// first-time GETs for the one path -- the browser has never fetched it before
// in this page load, so there is no warm cache entry for a later duplicate to
// reuse, and the media origin sees a burst of concurrent identical requests
// instead of one. kind_robots#1592 tried caching the /images/* redirect
// response, which only helps a *second* visit reuse a *first* visit's cache
// entry -- it does nothing for N tags racing each other on the very first
// visit, which is the case that was actually flaking.
//
// This holds every occurrence but the first back until that first request has
// settled (success or failure), so repeats always land on a now-warm cache
// entry instead of piling onto the origin at once.
import { ref, watchEffect, type Ref } from 'vue'

const inFlight = new Map<string, Promise<void>>()

export function useDedupedArtwork(
  source: () => string | undefined,
): Ref<string | undefined> {
  const resolvedSrc = ref<string | undefined>()

  watchEffect(async () => {
    const url = source()
    resolvedSrc.value = undefined
    if (!url || !import.meta.client) return

    let settle = inFlight.get(url)
    if (!settle) {
      settle = new Promise<void>((resolve) => {
        const probe = new Image()
        probe.onload = () => resolve()
        probe.onerror = () => resolve()
        probe.src = url
      })
      inFlight.set(url, settle)
    }

    await settle
    if (source() === url) resolvedSrc.value = url
  })

  return resolvedSrc
}
