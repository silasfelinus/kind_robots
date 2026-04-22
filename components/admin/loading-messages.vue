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

// ── Timing knobs ──────────────────────────────────────────────────────────────
const FIRST_MESSAGE_MS = 2200 // how long the first message shows
const SECOND_MESSAGE_LEAD_MS = 1600 // pause before rotation begins / sequence gates
const ROTATING_MESSAGE_MS = 1900 // interval between messages during store wait
const READY_HOLD_MS = 1800 // [theirs] grace period after stores signal ready
const MIN_TOTAL_MS = 5500 // [mine]   absolute wall-clock floor from mount
const OVERLAY_FADE_MS = 1600 // [theirs] longer fade feels more cinematic
// ─────────────────────────────────────────────────────────────────────────────

const startTime = Date.now()

let destroyed = false
let rotationIntervalId: ReturnType<typeof setInterval> | null = null
let fallbackFadeTimeoutId: ReturnType<typeof setTimeout> | null = null
let readyHoldTimeoutId: ReturnType<typeof setTimeout> | null = null // [theirs] double-schedule guard

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    if (destroyed) {
      resolve()
      return
    }
    const id = setTimeout(resolve, ms)
    ;(wait as any)._lastId = id
  })
}

function nextMessage() {
  currentMessage.value =
    loadStore.randomLoadMessage?.() ??
    'Wiring robots for suspicious levels of charm...'
  messageKey.value += 1
}

// [theirs] named helper keeps onBeforeUnmount clean
function clearRotation() {
  if (!rotationIntervalId) return
  clearInterval(rotationIntervalId)
  rotationIntervalId = null
}

// [mine] separated from scheduling so the delay math is its own concern
function doFade() {
  if (destroyed || fadeOverlay.value) return
  fadeOverlay.value = true
  if (fallbackFadeTimeoutId) clearTimeout(fallbackFadeTimeoutId)
  fallbackFadeTimeoutId = setTimeout(
    () => emit('hidden'),
    OVERLAY_FADE_MS + 120,
  )
}

// Synthesis: Math.max lets both constraints win simultaneously.
// Fast stores? MIN_TOTAL_MS protects the floor.
// Slow stores finishing mid-sequence? READY_HOLD_MS still gives a grace beat.
function scheduleFade() {
  if (!props.storesReady) return
  if (!minimumSequenceComplete.value) return
  if (fadeOverlay.value) return
  if (readyHoldTimeoutId) return // [theirs] prevent double-scheduling

  clearRotation()

  const elapsed = Date.now() - startTime
  const holdNeeded = Math.max(READY_HOLD_MS, MIN_TOTAL_MS - elapsed)

  readyHoldTimeoutId = setTimeout(doFade, holdNeeded)
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
  clearRotation() // [theirs]
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
