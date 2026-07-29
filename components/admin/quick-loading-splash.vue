<template>
  <div
    class="quick-loading-overlay"
    :class="{ 'quick-loading-overlay--fade': fading }"
    @transitionend="handleTransitionEnd"
  >
    <div class="quick-loading-content">
      <div class="quick-loading-visual-frame">
        <img
          :src="visualSrc"
          alt="Kind Robots"
          class="quick-loading-visual"
          :class="{ 'quick-loading-visual--ready': visualReady }"
          loading="eager"
          fetchpriority="high"
          decoding="async"
          @load="visualReady = true"
          @error="useLogoFallback"
        />
      </div>

      <p class="quick-loading-message" aria-live="polite">
        {{ message }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useLoadStore } from '@/stores/loadStore'

const emit = defineEmits<{
  covered: []
  hidden: []
}>()

const animationModules = import.meta.glob<string>(
  '../../assets/images/startup-animations/launch-*.webp',
  {
    eager: true,
    import: 'default',
    query: '?url',
  },
)

const animationUrls = Object.values(animationModules)
const logoFallback = '/images/kindlogo_new.webp'
const selectedAnimation =
  animationUrls[Math.floor(Math.random() * animationUrls.length)]

const loadStore = useLoadStore()
const visualSrc = ref(selectedAnimation || logoFallback)
const visualReady = ref(false)
const fading = ref(false)
const hiddenEmitted = ref(false)
const message = ref(
  loadStore.randomLoadMessage?.() ??
    'Wiring robots for suspicious levels of charm...',
)

const TOTAL_MS = 2000
const FADE_MS = 400
const HOLD_MS = TOTAL_MS - FADE_MS

let fadeTimer: ReturnType<typeof setTimeout> | null = null
let hiddenTimer: ReturnType<typeof setTimeout> | null = null

function emitHiddenOnce(): void {
  if (hiddenEmitted.value) return
  hiddenEmitted.value = true
  emit('hidden')
}

function beginFade(): void {
  if (fading.value) return
  fading.value = true

  hiddenTimer = setTimeout(() => {
    emitHiddenOnce()
  }, FADE_MS + 80)
}

function handleTransitionEnd(event: TransitionEvent): void {
  if (event.propertyName !== 'opacity' || !fading.value) return
  emitHiddenOnce()
}

function useLogoFallback(): void {
  if (visualSrc.value === logoFallback) return
  visualReady.value = false
  visualSrc.value = logoFallback
}

onMounted(() => {
  emit('covered')
  fadeTimer = setTimeout(beginFade, HOLD_MS)
})

onBeforeUnmount(() => {
  if (fadeTimer) {
    clearTimeout(fadeTimer)
    fadeTimer = null
  }

  if (hiddenTimer) {
    clearTimeout(hiddenTimer)
    hiddenTimer = null
  }
})
</script>

<style scoped>
.quick-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.12);
  opacity: 1;
  pointer-events: none;
  transition: opacity 400ms ease;
  backdrop-filter: blur(2px);
}

.quick-loading-overlay--fade {
  opacity: 0;
}

.quick-loading-content {
  display: grid;
  width: min(92vw, 32rem);
  place-items: center;
  gap: 0.75rem;
}

.quick-loading-visual-frame {
  position: relative;
  display: grid;
  width: min(72vw, 20rem);
  aspect-ratio: 1;
  place-items: center;
  isolation: isolate;
}

.quick-loading-visual-frame::before {
  position: absolute;
  inset: 8%;
  border-radius: 48% 52% 57% 43% / 55% 44% 56% 45%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.2),
    rgba(255, 255, 255, 0.06) 52%,
    transparent 72%
  );
  content: '';
  filter: blur(1.4rem);
  pointer-events: none;
}

.quick-loading-visual {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0;
  transform: scale(0.94);
  transition:
    opacity 220ms ease,
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
  filter: drop-shadow(0 1rem 2rem rgba(0, 0, 0, 0.32));
  -webkit-mask-image: radial-gradient(
    ellipse 55% 55% at center,
    #000 58%,
    rgba(0, 0, 0, 0.96) 72%,
    transparent 100%
  );
  mask-image: radial-gradient(
    ellipse 55% 55% at center,
    #000 58%,
    rgba(0, 0, 0, 0.96) 72%,
    transparent 100%
  );
}

.quick-loading-visual--ready {
  opacity: 1;
  transform: scale(1);
}

.quick-loading-message {
  max-width: min(90vw, 32rem);
  margin: 0;
  padding: 0.55rem 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.72);
  color: #fff;
  font-size: clamp(0.9rem, 2vw, 1.1rem);
  font-weight: 750;
  text-align: center;
  box-shadow: 0 0.6rem 1.5rem rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(0.7rem);
}

@media (prefers-reduced-motion: reduce) {
  .quick-loading-overlay,
  .quick-loading-visual {
    transition: none;
  }
}
</style>
