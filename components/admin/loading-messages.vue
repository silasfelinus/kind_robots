<!-- /components/content/story/loading-messages.vue -->
<template>
  <div
    class="loading-overlay"
    :class="{ 'loading-overlay--fade': fadeOverlay }"
    @transitionend="handleTransitionEnd"
  >
    <NuxtImg
      src="/images/kindlogo_new.webp"
      alt="Kind Robots"
      class="loading-logo"
      :width="320"
      :height="320"
      format="webp"
      :quality="72"
      preload
      loading="eager"
      fetchpriority="high"
      decoding="async"
    />

    <div class="loading-status">
      <Icon name="kind-icon:bubble-loading" class="bubble-loader" />

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

const FIRST_MESSAGE_MS = 850
const SLOW_LOAD_MESSAGE_MS = 1500
const ROTATING_MESSAGE_MS = 1600
const READY_HOLD_MS = 250
const MIN_TOTAL_MS = 1650
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
  if (destroyed) return

  minimumSequenceComplete.value = true

  if (props.storesReady) {
    scheduleFade()
    return
  }

  await wait(SLOW_LOAD_MESSAGE_MS)
  if (destroyed || props.storesReady || fadeOverlay.value) return

  nextMessage()
  rotationIntervalId = setInterval(() => {
    if (destroyed) return
    nextMessage()
    if (props.storesReady) scheduleFade()
  }, ROTATING_MESSAGE_MS)
}

const hiddenEmitted = ref(false)

function emitHiddenOnce() {
  if (hiddenEmitted.value) return
  hiddenEmitted.value = true
  emit('hidden')
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: #000;
  opacity: 1;
  transition: opacity 0.65s ease;
  pointer-events: auto;
  contain: layout paint style;
  will-change: opacity;
}

.loading-overlay--fade {
  opacity: 0;
  pointer-events: none;
}

.loading-logo {
  width: clamp(9rem, 24vw, 14rem);
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 0.9rem 1.8rem rgba(255, 255, 255, 0.16));
}

.loading-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
}

.loading-message {
  max-width: min(90vw, 44rem);
  min-height: 3.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 1.2rem;
  background: rgba(0, 0, 0, 0.78);
  color: #ffffff;
  font-size: clamp(1.05rem, 2vw, 1.75rem);
  font-weight: 700;
  text-align: center;
  box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.42);
  will-change: transform, opacity;
  transform: translateZ(0);
}

.bubble-loader {
  font-size: clamp(2.5rem, 6vw, 4rem);
  color: #ffffff;
  filter: drop-shadow(0 0 0.75rem rgba(255, 255, 255, 0.22));
}

.loader-message-enter-active,
.loader-message-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.loader-message-enter-from,
.loader-message-leave-to {
  opacity: 0;
  transform: translateY(5px);
}
</style>
