<!-- /components/content/story/loading-messages.vue -->
<template>
  <div
    class="loading-overlay"
    :class="{ 'loading-overlay--fade': fadeOverlay }"
    @transitionend="handleTransitionEnd"
  >
    <div
      class="loading-content"
      :class="{ 'loading-content--hidden': startupStore.immersive }"
    >
      <div class="loading-heading">Building Kind Robots...</div>

      <div class="loading-logo-frame">
        <startup-intro-visual @settled="handleIntroVisualSettled" />
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
import { useStartupAnimationStore } from '@/stores/startupAnimationStore'
import { consumeStartupStartedAt } from '@/utils/startupLaunch'

const props = defineProps<{ storesReady: boolean }>()
const emit = defineEmits<{
  covered: []
  hiding: []
  hidden: []
}>()

const loadStore = useLoadStore()
const startupStore = useStartupAnimationStore()

const currentMessage = ref('Wiring robots for suspicious levels of charm...')
const messageKey = ref(0)
const fadeOverlay = ref(false)
const minimumSequenceComplete = ref(false)
const introVisualSettled = ref(false)
const introVisualKind = ref<'logo' | 'animation'>('logo')
const hiddenEmitted = ref(false)
const exitRequested = ref(false)

const EXTRA_MESSAGE_COUNT = 2
const EXTRA_MESSAGE_MS = 1250
const ROTATING_MESSAGE_MS = 1600
const READY_HOLD_MS = 450
const ANIMATION_VISIBLE_HOLD_MS = 1500
const MIN_TOTAL_MS =
  (EXTRA_MESSAGE_COUNT + 1) * EXTRA_MESSAGE_MS + READY_HOLD_MS
const OVERLAY_FADE_MS = 650
const HARD_EXIT_MS = 9000

const startTime = consumeStartupStartedAt()

let destroyed = false
let rotationIntervalId: ReturnType<typeof setInterval> | null = null
let fallbackFadeTimeoutId: ReturnType<typeof setTimeout> | null = null
let readyHoldTimeoutId: ReturnType<typeof setTimeout> | null = null
let hardExitTimeoutId: ReturnType<typeof setTimeout> | null = null

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    if (destroyed) {
      resolve()
      return
    }

    setTimeout(resolve, ms)
  })
}

function waitUntil(offsetMs: number) {
  return wait(Math.max(0, startTime + offsetMs - Date.now()))
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

function clearReadyHold() {
  if (!readyHoldTimeoutId) return
  clearTimeout(readyHoldTimeoutId)
  readyHoldTimeoutId = null
}

function clearHardExit() {
  if (!hardExitTimeoutId) return
  clearTimeout(hardExitTimeoutId)
  hardExitTimeoutId = null
}

function emitHiddenOnce() {
  if (hiddenEmitted.value) return
  hiddenEmitted.value = true
  emit('hidden')
}

function doFade() {
  if (destroyed || fadeOverlay.value) return

  clearRotation()
  clearReadyHold()
  clearHardExit()
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
  if (!introVisualSettled.value) return
  if (fadeOverlay.value) return
  if (startupStore.immersive) return
  if (readyHoldTimeoutId) return

  clearRotation()

  const elapsed = Date.now() - startTime
  const minimumRemaining = Math.max(READY_HOLD_MS, MIN_TOTAL_MS - elapsed)
  const animationVisibleRemaining = Math.max(
    0,
    ANIMATION_VISIBLE_HOLD_MS - elapsed,
  )
  const holdNeeded = exitRequested.value
    ? 0
    : Math.max(
        minimumRemaining,
        introVisualKind.value === 'animation' ? animationVisibleRemaining : 0,
      )

  readyHoldTimeoutId = setTimeout(() => {
    doFade()
  }, holdNeeded)
}

function startHardExitWatchdog() {
  const remaining = Math.max(0, startTime + HARD_EXIT_MS - Date.now())

  hardExitTimeoutId = setTimeout(() => {
    hardExitTimeoutId = null

    if (
      startupStore.controlsActive &&
      document.querySelector('.startup-animation__controls--active')
    ) {
      return
    }

    exitRequested.value = true
    doFade()
  }, remaining)
}

function handleIntroVisualSettled(kind: 'logo' | 'animation') {
  introVisualKind.value = kind
  introVisualSettled.value = true
  scheduleFade()
}

function handleTransitionEnd(event: TransitionEvent) {
  if (event.propertyName !== 'opacity') return
  if (!fadeOverlay.value) return
  emitHiddenOnce()
}

async function runVisualSequence() {
  for (let index = 0; index < EXTRA_MESSAGE_COUNT; index += 1) {
    await waitUntil((index + 1) * EXTRA_MESSAGE_MS)
    if (destroyed) return
    nextMessage()
  }

  minimumSequenceComplete.value = true

  if (props.storesReady && introVisualSettled.value) {
    scheduleFade()
    return
  }

  rotationIntervalId = setInterval(() => {
    if (destroyed) return
    nextMessage()
    if (props.storesReady && introVisualSettled.value) scheduleFade()
  }, ROTATING_MESSAGE_MS)
}

watch(
  () => props.storesReady,
  (ready) => {
    if (!ready) return

    if (exitRequested.value) {
      doFade()
      return
    }

    scheduleFade()
  },
)

watch(
  () => startupStore.immersive,
  (immersive) => {
    if (immersive) {
      clearReadyHold()
      return
    }

    scheduleFade()
  },
)

watch(
  () => startupStore.exitRequest,
  () => {
    exitRequested.value = true
    doFade()
  },
)

onMounted(async () => {
  emit('covered')
  startHardExitWatchdog()
  await runVisualSequence()
})

onBeforeUnmount(() => {
  destroyed = true
  clearRotation()
  clearReadyHold()
  clearHardExit()

  if (fallbackFadeTimeoutId) {
    clearTimeout(fallbackFadeTimeoutId)
    fallbackFadeTimeoutId = null
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
  height: min(92vh, 52rem);
  grid-template-rows: minmax(3.75rem, auto) minmax(0, 1fr) 8rem;
  place-items: center;
  opacity: 1;
  transform: scale(1);
  transition:
    opacity 320ms ease,
    transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
}

.loading-content--hidden {
  opacity: 0;
  transform: scale(0.97);
  pointer-events: none;
}

.loading-heading,
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
  font-weight: 700;
  text-align: center;
  box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.42);
  transform: translateZ(0);
}

.loading-heading {
  font-size: clamp(1.2rem, 2.25vw, 2rem);
  font-weight: 800;
  letter-spacing: 0.02em;
}

.loading-logo-frame {
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 0;
  place-items: center;
  isolation: isolate;
}

.loading-logo-frame::before,
.loading-logo-frame::after {
  position: absolute;
  z-index: 0;
  width: clamp(17rem, 60vw, 36rem);
  aspect-ratio: 1;
  content: '';
  pointer-events: none;
}

.loading-logo-frame::before {
  border-radius: 46% 54% 61% 39% / 57% 41% 59% 43%;
  background:
    radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.2), transparent 42%),
    radial-gradient(circle at 64% 68%, rgba(129, 230, 217, 0.16), transparent 46%),
    radial-gradient(circle, rgba(255, 255, 255, 0.08), transparent 68%);
  filter: blur(1.8rem);
  opacity: 0.88;
  animation: loading-logo-haze 8s ease-in-out infinite alternate;
}

.loading-logo-frame::after {
  width: clamp(15rem, 54vw, 32rem);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 58% 42% 47% 53% / 43% 62% 38% 57%;
  box-shadow:
    0 0 2.5rem rgba(255, 255, 255, 0.12),
    inset 0 0 2.25rem rgba(255, 255, 255, 0.08);
  filter: blur(0.65rem);
  opacity: 0.72;
  animation: loading-logo-wobble 10s ease-in-out infinite alternate;
}

:deep(.loading-logo) {
  position: relative;
  z-index: 1;
  width: clamp(16rem, 58vw, 34rem);
  max-height: 100%;
  height: auto;
  object-fit: contain;
  opacity: 0;
  transform: translateY(0.75rem) scale(0.92);
  transition:
    opacity 900ms ease,
    transform 1100ms cubic-bezier(0.22, 1, 0.36, 1);
  filter: drop-shadow(0 1.5rem 3rem rgba(255, 255, 255, 0.2));
  -webkit-mask-image: radial-gradient(
    ellipse 54% 54% at center,
    #000 58%,
    rgba(0, 0, 0, 0.96) 70%,
    transparent 100%
  );
  mask-image: radial-gradient(
    ellipse 54% 54% at center,
    #000 58%,
    rgba(0, 0, 0, 0.96) 70%,
    transparent 100%
  );
  will-change: opacity, transform;
}

:deep(.loading-logo--ready) {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.loading-overlay--fade :deep(.loading-logo) {
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
  font-size: clamp(1.05rem, 2vw, 1.75rem);
  will-change: transform, opacity;
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

@keyframes loading-logo-haze {
  0% {
    border-radius: 46% 54% 61% 39% / 57% 41% 59% 43%;
    transform: rotate(-2deg) scale(0.96);
  }

  100% {
    border-radius: 57% 43% 39% 61% / 44% 58% 42% 56%;
    transform: rotate(3deg) scale(1.05);
  }
}

@keyframes loading-logo-wobble {
  0% {
    border-radius: 58% 42% 47% 53% / 43% 62% 38% 57%;
    transform: rotate(2deg) scale(1.02);
  }

  100% {
    border-radius: 42% 58% 55% 45% / 61% 39% 57% 43%;
    transform: rotate(-3deg) scale(0.95);
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-content,
  :deep(.loading-logo),
  .loading-logo-frame::before,
  .loading-logo-frame::after {
    animation: none;
    transition: none;
  }
}
</style>