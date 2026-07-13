// /plugins/navigation-image-fallback.client.ts
const fallbackImage = '/images/botcafe.webp'
const navigationImagePrefixes = [
  '/images/channels/',
  '/images/dashboard-tabs/',
]

function pathname(value: string): string {
  try {
    return new URL(value, window.location.origin).pathname
  } catch {
    return value.split(/[?#]/)[0] ?? ''
  }
}

function isNavigationArtwork(image: HTMLImageElement): boolean {
  const source = pathname(image.currentSrc || image.src)
  return navigationImagePrefixes.some((prefix) => source.startsWith(prefix))
}

export default defineNuxtPlugin(() => {
  document.addEventListener(
    'error',
    (event) => {
      const image = event.target
      if (!(image instanceof HTMLImageElement)) return
      if (!isNavigationArtwork(image)) return
      if (image.dataset.navigationFallbackApplied === 'true') return

      image.dataset.navigationFallbackApplied = 'true'
      image.src = fallbackImage
    },
    true,
  )
})
