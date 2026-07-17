<!-- /components/content/story/loading-messages.vue -->
<template>
  <div
    class="loading-overlay"
    :class="{ 'loading-overlay--fade': fadeOverlay }"
    @transitionend="handleTransitionEnd"
  >
    <div class="loading-content">
      <div class="loading-logo-frame">
        <NuxtImg
          src="/images/kindlogo_new.webp"
          alt="Kind Robots"
          class="loading-logo"
          :class="{ 'loading-logo--ready': logoLoaded }"
          :width="720"
          :height="720"
          format="webp"
          :quality="82"
          preload
          loading="eager"
          fetchpriority="high"
          decoding="async"
          @load="logoLoaded = true"
        />
      </div>

      <div class="loading-status">
        <span class="loading-spinner-slot" aria-hidden="true">
          <Icon name="kind-icon:bubble-loading" class="bubble-loader" />
        </span>

        <transition name="loader-message" mode="out-in">
          <div
            :key="messageKey"
            class="loading-message"
            aria-live="polite"
          >
            {{ currentMessage }}
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLoadStore } from '../../stores/loadStore'

const props = defineProps<{ storesReady: boolean }>()
const emit = defineEmits<{
  covered: []
  hiding: []
  hidden: []
}>()

const loadStore = useLoadStore()

const currentMessage = ref('Building Kind Robots...')
const messageKey = ref(0)
const fadeOverlay = ref(false)
const minimumSequenceComplete = ref(false)
const logoLoaded = ref(false)
const hiddenEmitted = ref(false)

const FIRST_MESSAGE_MS = 950
const EXTRA_MESSAGE_COUNT = 2
const EXTRA_MESSAGE_MS = 1250
const ROTATING_MESSAGE_MS = 1600
const READY_HOLD_MS = 450
const MIN_TOTAL_MS =
  FIRST_MESSAGE_MS + EXTRA_MESSAGE_COUNT * EXTRA_MESSAGE_MS + READY_HOLD_MS
const OVERLAY_FADE_MS = 650

const startTime = Date.now()

let destroyed = false
let rotationIntervalId: ReturnType<typeof setInterval> | null = null
let fallbackFadeTimeoutId: ReturnType<typeof setTimeout> | null = null
let readyHoldTimeoutId: ReturnType<typeof setTimeout> | null = null

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    if (destroyed) {
      resolve()
      return
    }

    setTimeout(resolve, ms)
  })
}

function nextMessage() {
  currentMessage.value =
    loadStore.randomLoadMessage?.() ??
    'Wiring robots for suspicious levels of charm...'
  messageKey.value += 1
}

function clearRotation() {
  if (!rotationIntervalId) return
  clearInterval(rotationIntervalId)
  rotationIntervalId = null
}

function emitHiddenOnce() {
  if (hiddenEmitted.value) return
  hiddenEmitted.value = true
  emit('hidden')
}

function doFade() {
  if (destroyed || fadeOverlay.value) return

  clearRotation()
  loadStore.revealDesktop()
  emit('hiding')
  fadeOverlay.value = true

  if (fallbackFadeTimeoutId) {
    clearTimeout(fallbackFadeTimeoutId)
  }

  fallbackFadeTimeoutId = setTimeout(() => {
    emitHiddenOnce()
  }, OVERLAY_FADE_MS + 120)
}

function scheduleFade() {
  if (!props.storesReady) return
  if (!minimumSequenceComplete.value) return
  if (fadeOverlay.value) return
  if (readyHoldTimeoutId) return

  clearRotation()

  const elapsed = Date.now() - startTime
  const holdNeeded = Math.max(READY_HOLD_MS, MIN_TOTAL_MS - elapsed)

  readyHoldTimeoutId = setTimeout(() => {
    doFade()
  }, holdNeeded)
}

function handleTransitionEnd(event: TransitionEvent) {
  if (event.propertyName !== 'opacity') return
  if (!fadeOverlay.value) return
  emitHiddenOnce()
}

async function runVisualSequence() {
  await wait(FIRST_MESSAGE_MS)

  for (let index = 0; index < EXTRA_MESSAGE_COUNT; index += 1) {
    if (destroyed) return
    nextMessage()
    await wait(EXTRA_MESSAGE_MS)
  }

  if (destroyed) return
  minimumSequenceComplete.value = true

  if (props.storesReady) {
    scheduleFade()
    return
  }

  rotationIntervalId = setInterval(() => {
    if (destroyed) return
    nextMessage()
    if (props.storesReady) scheduleFade()
  }, ROTATING_MESSAGE_MS)
}

watch(
  () => props.storesReady,
  (ready) => {
    if (ready) scheduleFade()
  },
)

onMounted(async () => {
  emit('covered')
  await runVisualSequence()
})

onBeforeUnmount(() => {
  destroyed = true
  clearRotation()

  if (fallbackFadeTimeoutId) {
    clearTimeout(fallbackFadeTimeoutId)
    fallbackFadeTimeoutId = null
  }

  if (readyHoldTimeoutId) {
    clearTimeout(readyHoldTimeoutId)
    readyHoldTimeoutId = null
  }
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: transparent;
  opacity: 1;
  transition: opacity 650ms ease;
  pointer-events: auto;
  contain: layout paint style;
  will-change: opacity;
}

.loading-overlay--fade {
  opacity: 0;
  pointer-events: none;
}

.loading-content {
  display: grid;
  width: min(98vw, 64rem);
  grid-template-rows: clamp(20rem, 58vw, 36rem) 8rem;
  place-items: center;
}

.loading-logo-frame {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
}

.loading-logo {
  width: clamp(20rem, 58vw, 34rem);
  height: auto;
  object-fit: contain;
  opacity: 0;
  transform: translateY(0.75rem) scale(0.92);
  transition:
    opacity 900ms ease,
    transform 1100ms cubic-bezier(0.22, 1, 0.36, 1);
  filter: drop-shadow(0 1.5rem 3rem rgba(255, 255, 255, 0.2));
  will-change: opacity, transform;
}

.loading-logo--ready {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.loading-overlay--fade .loading-logo {
  opacity: 0;
  transform: translateY(-0.5rem) scale(1.04);
  transition-duration: 650ms;
}

.loading-status {
  display: grid;
  width: 100%;
  min-height: 8rem;
  grid-template-rows: 4rem 4rem;
  place-items: center;
}

.loading-spinner-slot {
  display: grid;
  width: 4rem;
  height: 4rem;
  place-items: center;
}

.loading-message {
  display: flex;
  width: fit-content;
  max-width: min(90vw, 44rem);
  min-height: 3.75rem;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 1.2rem;
  background: rgba(0, 0, 0, 0.78);
  color: #fff;
  font-size: clamp(1.05rem, 2vw, 1.75rem);
  font-weight: 700;
  text-align: center;
  box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.42);
  will-change: transform, opacity;
  transform: translateZ(0);
}

.bubble-loader {
  display: block;
  width: 4rem;
  height: 4rem;
  color: #fff;
  font-size: 4rem;
  filter: drop-shadow(0 0 0.75rem rgba(255, 255, 255, 0.22));
}

.loader-message-enter-active,
.loader-message-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}

.loader-message-enter-from,
.loader-message-leave-to {
  opacity: 0;
  transform: translateY(5px);
}
</style>
