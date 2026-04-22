<!-- /components/content/story/loading-messages.vue -->
<template>
  <div
    class="loading-overlay"
    :class="{ 'loading-overlay--fade': fadeOverlay }"
    @transitionend="handleTransitionEnd"
  >
    <Icon name="kind-icon:bubble-loading" class="bubble-loader" />

    <transition name="loader-message" mode="out-in">
      <div :key="messageKey" class="loading-message">
        {{ currentMessage }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
// /components/content/story/loading-messages.vue
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLoadStore } from '../../stores/loadStore'

const props = defineProps<{
  storesReady: boolean
}>()

const emit = defineEmits<{
  hidden: []
}>()

const loadStore = useLoadStore()

const currentMessage = ref('Building Kind Robots...')
const messageKey = ref(0)
const fadeOverlay = ref(false)
const minimumSequenceComplete = ref(false)

const FIRST_MESSAGE_MS = 2200
const SECOND_MESSAGE_LEAD_MS = 1600
const ROTATING_MESSAGE_MS = 1900
const READY_HOLD_MS = 1800
const OVERLAY_FADE_MS = 1600

let destroyed = false
let rotationIntervalId: ReturnType<typeof setInterval> | null = null
let fallbackFadeTimeoutId: ReturnType<typeof setTimeout> | null = null
let readyHoldTimeoutId: ReturnType<typeof setTimeout> | null = null

function wait(ms: number) {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(resolve, ms)
    if (destroyed) {
      clearTimeout(timeoutId)
      resolve(undefined)
    }
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

function scheduleFade() {
  if (!props.storesReady) return
  if (!minimumSequenceComplete.value) return
  if (fadeOverlay.value) return
  if (readyHoldTimeoutId) return

  clearRotation()

  readyHoldTimeoutId = setTimeout(() => {
    if (destroyed) return
    fadeOverlay.value = true

    if (fallbackFadeTimeoutId) {
      clearTimeout(fallbackFadeTimeoutId)
    }

    fallbackFadeTimeoutId = setTimeout(() => {
      emit('hidden')
    }, OVERLAY_FADE_MS + 120)
  }, READY_HOLD_MS)
}

function handleTransitionEnd(event: TransitionEvent) {
  if (event.propertyName !== 'opacity') return
  if (!fadeOverlay.value) return
  emit('hidden')
}

async function runVisualSequence() {
  await wait(FIRST_MESSAGE_MS)
  if (destroyed) return

  nextMessage()

  await wait(SECOND_MESSAGE_LEAD_MS)
  if (destroyed) return

  minimumSequenceComplete.value = true

  if (props.storesReady) {
    scheduleFade()
    return
  }

  rotationIntervalId = setInterval(() => {
    nextMessage()
    if (props.storesReady) {
      scheduleFade()
    }
  }, ROTATING_MESSAGE_MS)
}

watch(
  () => props.storesReady,
  (ready) => {
    if (!ready) return
    scheduleFade()
  },
)

onMounted(async () => {
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
  gap: 1.25rem;
  background: #000;
  opacity: 1;
  transition: opacity 1.6s ease;
  pointer-events: auto;
}

.loading-overlay--fade {
  opacity: 0;
  pointer-events: none;
}

.loading-message {
  max-width: min(90vw, 44rem);
  min-height: 4.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem 1.35rem;
  border-radius: 1rem;
  border: 1px solid oklch(var(--bc) / 0.2);
  background: oklch(var(--b1) / 0.92);
  color: oklch(var(--bc));
  font-size: clamp(1.1rem, 2vw, 2rem);
  font-weight: 700;
  text-align: center;
  box-shadow: 0 0.75rem 2rem oklch(0 0 0 / 0.25);
  backdrop-filter: blur(10px);
}

.bubble-loader {
  font-size: clamp(4rem, 10vw, 6rem);
  color: oklch(var(--p));
  filter: drop-shadow(0 0 1rem oklch(var(--p) / 0.35));
}

.loader-message-enter-active,
.loader-message-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}

.loader-message-enter-from,
.loader-message-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
