// /stores/helpers/artworkLoadHelper.ts
const inFlight = new Map<string, Promise<void>>()

export function preloadArtwork(url: string): Promise<void> {
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
  return settle
}
