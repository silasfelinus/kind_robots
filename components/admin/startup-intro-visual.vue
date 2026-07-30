<template>
  <img
    :key="visualSrc"
    :src="visualSrc"
    alt="Kind Robots"
    class="loading-logo"
    :class="{ 'loading-logo--ready': visualReady }"
    width="720"
    height="720"
    loading="eager"
    fetchpriority="high"
    decoding="async"
    @load="visualReady = true"
    @error="useLogoFallback"
  />
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

interface StartupAnimationsResponse {
  animations?: string[]
}

const LOGO_SRC = '/images/kindlogo_new.webp'
const ANIMATION_CHANCE = 0.5
const REQUEST_TIMEOUT_MS = 2_800
const IMAGE_LOAD_TIMEOUT_MS = 3_200

const shouldTryAnimation = import.meta.client && Math.random() < ANIMATION_CHANCE
const visualSrc = ref(LOGO_SRC)
const visualReady = ref(false)

let destroyed = false
let requestController: AbortController | null = null
let cancelPreload: (() => void) | null = null

function setVisual(src: string): void {
  if (destroyed || visualSrc.value === src) return
  visualReady.value = false
  visualSrc.value = src
}

function useLogoFallback(): void {
  if (visualSrc.value === LOGO_SRC) return
  setVisual(LOGO_SRC)
}

function preloadAnimation(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const image = new Image()
    let settled = false

    const finish = (loaded: boolean) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeoutId)
      image.onload = null
      image.onerror = null
      if (cancelPreload === cancel) cancelPreload = null
      resolve(loaded)
    }

    const cancel = () => finish(false)
    const timeoutId = window.setTimeout(cancel, IMAGE_LOAD_TIMEOUT_MS)

    cancelPreload = cancel
    image.onload = () => finish(true)
    image.onerror = cancel
    image.src = src
  })
}

async function selectAnimation(): Promise<void> {
  requestController = new AbortController()
  const requestTimeout = window.setTimeout(
    () => requestController?.abort(),
    REQUEST_TIMEOUT_MS,
  )

  try {
    const fetchResponse = await fetch('/api/startup/animations', {
      cache: 'force-cache',
      headers: { Accept: 'application/json' },
      signal: requestController.signal,
    })
    if (!fetchResponse.ok) {
      throw new Error(`Animation catalog ${fetchResponse.status}`)
    }

    const response = (await fetchResponse.json()) as StartupAnimationsResponse
    if (destroyed) return

    const animations = (response.animations || []).filter((url) =>
      /^\/images\/startup-animations\/launch-[a-z0-9][a-z0-9-]*\.webp$/i.test(
        url,
      ),
    )
    if (!animations.length) return

    const selected = animations[Math.floor(Math.random() * animations.length)]
    if (!selected) return

    const loaded = await preloadAnimation(selected)
    if (!loaded || destroyed) return

    setVisual(selected)
  } catch {
    // The logo remains visible when catalog discovery or preloading fails.
  } finally {
    window.clearTimeout(requestTimeout)
    requestController = null
  }
}

if (shouldTryAnimation) {
  void selectAnimation()
}

onBeforeUnmount(() => {
  destroyed = true
  requestController?.abort()
  requestController = null
  cancelPreload?.()
  cancelPreload = null
})
</script>
