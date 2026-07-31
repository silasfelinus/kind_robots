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
        <startup-intro-visual />
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
const hiddenEmitted = ref(false)

/*
 * The intro is TIME-driven, never readiness-driven.
 *
 * It used to be gated on `storesReady` (≈25 sequential store initialize()
 * calls, several of them network-bound with 10s timeouts of their own) and on
 * the intro webp firing `load`. Both are unbounded, so on any slow or failing
 * request the fade simply never ran and the only thing that ever cleared the
 * launch screen was an emergency watchdog — a hard cut, not a fade.
 *
 * Now: fade at INTRO_BASE_MS once the stores are ready, and at INTRO_MAX_MS no
 * matter what. Store readiness can only make the intro end *sooner*; it can
 * never hold it open. Nothing else is allowed to gate the fade.
 */
const INTRO_BASE_MS = 3500
const INTRO_MAX_MS = 5000
const ROTATING_MESSAGE_MS = 1250
const OVERLAY_FADE_MS = 650

const FADING_CLASS = 'kr-startup-fading'

let destroyed = false
let sequenceStartedAt = 0
let rotationIntervalId: ReturnType<typeof setInterval> | null = null
let fallbackFadeTimeoutId: ReturnType<typeof setTimeout> | null = null
let baseFadeTimeoutId: ReturnType<typeof setTimeout> | null = null
let capFadeTimeoutId: ReturnType<typeof setTimeout> | null = null

function elapsed(): number {
  return performance.now() - sequenceStartedAt
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

function clearFadeTimers() {
  if (baseFadeTimeoutId) {
    clearTimeout(baseFadeTimeoutId)
    baseFadeTimeoutId = null
  }

  if (capFadeTimeoutId) {
    clearTimeout(capFadeTimeoutId)
    capFadeTimeoutId = null
  }
}

function emitHiddenOnce() {
  if (hiddenEmitted.value) return
  hiddenEmitted.value = true
  emit('hidden')
}

function doFade() {
  if (destroyed || fadeOverlay.value) return

  clearRotation()
  clearFadeTimers()
  loadStore.revealDesktop()
  emit('hiding')
  fadeOverlay.value = true

  /*
   * Drive every startup surface off one class change so the webp, the loading
   * messages, the animated background, the black base and the control tray all
   * fade on the same 650ms curve instead of relying on the client plugin's
   * MutationObserver noticing us first.
   */
  if (import.meta.client) {
    document.documentElement.classList.add(FADING_CLASS)
  }

  if (fallbackFadeTimeoutId) {
    clearTimeout(fallbackFadeTimeoutId)
  }

  fallbackFadeTimeoutId = setTimeout(() => {
    emitHiddenOnce()
  }, OVERLAY_FADE_MS + 120)
}

/*
 * Arms both deadlines against time already served, so this stays correct if it
 * is ever re-armed rather than restarting the intro from zero.
 */
function armFadeTimers() {
  clearFadeTimers()

  if (destroyed || fadeOverlay.value) return
  if (startupStore.immersive) return

  baseFadeTimeoutId = setTimeout(
    () => {
      baseFadeTimeoutId = null
      if (props.storesReady) doFade()
    },
    Math.max(0, INTRO_BASE_MS - elapsed()),
  )

  capFadeTimeoutId = setTimeout(
    () => {
      capFadeTimeoutId = null
      doFade()
    },
    Math.max(0, INTRO_MAX_MS - elapsed()),
  )
}

function handleTransitionEnd(event: TransitionEvent) {
  if (event.propertyName !== 'opacity') return
  if (!fadeOverlay.value) return
  emitHiddenOnce()
}

// Stores becoming ready can only pull the fade in, never push it out.
watch(
  () => props.storesReady,
  (ready) => {
    if (!ready || startupStore.immersive) return
    if (elapsed() >= INTRO_BASE_MS) doFade()
  },
)

/*
 * Explore mode holds the launch screen open for as long as the user wants.
 * Leaving it fades immediately — per spec, unpausing goes straight to the site
 * rather than resuming the remainder of the intro.
 */
watch(
  () => startupStore.immersive,
  (immersive) => {
    if (immersive) {
      clearFadeTimers()
      return
    }

    doFade()
  },
)

// Resume and the close button both dismiss without waiting for anything.
watch(
  () => startupStore.exitRequest,
  () => {
    doFade()
  },
)

onMounted(() => {
  // Timed from mount, never from navigation start: the app can hydrate many
  // seconds after navigation, and the intro should run for its own duration
  // once it is actually on screen.
  sequenceStartedAt = performance.now()

  emit('covered')

  rotationIntervalId = setInterval(() => {
    if (destroyed) return
    nextMessage()
  }, ROTATING_MESSAGE_MS)

  armFadeTimers()
})

onBeforeUnmount(() => {
  destroyed = true
  clearRotation()
  clearFadeTimers()

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
  /*
   * The black base and Screen FX are sibling layers below this foreground.
   * Painting black here would hide the effect because the loader lives in the
   * z-50 stacking context while the effect stage lives at z-49.
   */
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
    ellipse 50% 47% at 52% 49%,
    #000 42%,
    rgba(0, 0, 0, 0.86) 58%,
    rgba(0, 0, 0, 0.34) 76%,
    transparent 96%
  );
  mask-image: radial-gradient(
    ellipse 50% 47% at 52% 49%,
    #000 42%,
    rgba(0, 0, 0, 0.86) 58%,
    rgba(0, 0, 0, 0.34) 76%,
    transparent 96%
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
