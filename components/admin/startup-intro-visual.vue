<template>
  <img
    v-if="visualSrc"
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
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface StartupAnimationsResponse {
  animations?: string[]
}

const LOGO_SRC = '/images/kindlogo_new.webp'
const ANIMATION_CHANCE = 0.5
const FALLBACK_WAIT_MS = 900
const REQUEST_TIMEOUT_MS = 1_800

const shouldTryAnimation = import.meta.client && Math.random() < ANIMATION_CHANCE
const visualSrc = ref(shouldTryAnimation ? '' : LOGO_SRC)
const visualReady = ref(false)

let destroyed = false
let fallbackCommitted = false
let fallbackTimer: ReturnType<typeof setTimeout> | null = null
let requestController: AbortController | null = null

function setVisual(src: string): void {
  if (destroyed) return
  visualReady.value = false
  visualSrc.value = src
}

function commitLogoFallback(): void {
  fallbackCommitted = true
  setVisual(LOGO_SRC)
}

function useLogoFallback(): void {
  if (visualSrc.value === LOGO_SRC) return
  commitLogoFallback()
}

function clearFallbackTimer(): void {
  if (!fallbackTimer) return
  clearTimeout(fallbackTimer)
  fallbackTimer = null
}

async function selectAnimation(): Promise<void> {
  fallbackTimer = setTimeout(commitLogoFallback, FALLBACK_WAIT_MS)
  requestController = new AbortController()
  const requestTimeout = setTimeout(
    () => requestController?.abort(),
    REQUEST_TIMEOUT_MS,
  )

  try {
    const fetchResponse = await fetch('/api/startup/animations', {
      headers: { Accept: 'application/json' },
      signal: requestController.signal,
    })
    if (!fetchResponse.ok) throw new Error(`Animation catalog ${fetchResponse.status}`)

    const response = (await fetchResponse.json()) as StartupAnimationsResponse
    if (destroyed || fallbackCommitted) return

    const animations = (response.animations || []).filter((url) =>
      /^\/images\/startup-animations\/launch-[a-z0-9][a-z0-9-]*\.webp$/i.test(
        url,
      ),
    )
    if (!animations.length) {
      commitLogoFallback()
      return
    }

    clearFallbackTimer()
    const selected = animations[Math.floor(Math.random() * animations.length)]
    setVisual(selected || LOGO_SRC)
  } catch {
    if (!fallbackCommitted) commitLogoFallback()
  } finally {
    clearTimeout(requestTimeout)
    requestController = null
  }
}

onMounted(() => {
  if (shouldTryAnimation) void selectAnimation()
})

onBeforeUnmount(() => {
  destroyed = true
  clearFallbackTimer()
  requestController?.abort()
  requestController = null
})
</script>
