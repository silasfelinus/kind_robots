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

const props = defineProps<{ storesReady: boolean }>()
const emit = defineEmits<{ hidden: [] }>()

const loadStore = useLoadStore()

const currentMessage = ref('Building Kind Robots...')
const messageKey = ref(0)
const fadeOverlay = ref(false)
const minimumSequenceComplete = ref(false)

const FIRST_MESSAGE_MS = 1100
const SECOND_MESSAGE_LEAD_MS = 900
const ROTATING_MESSAGE_MS = 1300
const READY_HOLD_MS = 700
const MIN_TOTAL_MS = 2600
const OVERLAY_FADE_MS = 950

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

  loadStore.revealDesktop()
  fadeOverlay.value = true

  if (fallbackFadeTimeoutId) {
    clearTimeout(fallbackFadeTimeoutId)
  }

  fallbackFadeTimeoutId = setTimeout(() => {
    emit('hidden')
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
  transition: opacity 0.95s ease;
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
  background: rgba(0, 0, 0, 0.85);
  color: #ffffff;
  font-size: clamp(1.1rem, 2vw, 2rem);
  font-weight: 700;
  text-align: center;
  box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
}

.bubble-loader {
  font-size: clamp(4rem, 10vw, 6rem);
  color: #ffffff;
  filter: drop-shadow(0 0 0.75rem rgba(255, 255, 255, 0.25));
}

.loader-message-enter-active,
.loader-message-leave-active {
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
}

.loader-message-enter-from,
.loader-message-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
