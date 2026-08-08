// /composables/useDedupedArtwork.ts
import { ref, type Ref } from 'vue'

const inFlight = new Map<string, Promise<void>>()

export function useDedupedArtwork(): {
  resolvedSrc: Ref<string | undefined>
  request: (url: string) => void
} {
  const resolvedSrc = ref<string | undefined>()

  function request(url: string) {
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
    settle.then(() => {
      resolvedSrc.value = url
    })
  }

  return { resolvedSrc, request }
}
