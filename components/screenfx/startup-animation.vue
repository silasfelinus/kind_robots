<!-- /components/screenfx/startup-animation.vue -->
<template>
  <Teleport to="body">
    <div
      v-if="renderEffect && currentComponent"
      class="startup-animation__stage"
      :class="{
        'startup-animation__stage--ready': effectReady,
        'startup-animation__stage--fading': isFading,
      }"
    >
      <Suspense :key="resolvedEffectId" @resolve="handleEffectReady">
        <component
          :is="currentComponent"
          :key="resolvedEffectId"
          class="startup-animation__effect"
          aria-hidden="true"
        />

        <template #fallback>
          <span class="startup-animation__effect-placeholder" aria-hidden="true" />
        </template>
      </Suspense>
    </div>

    <div
      v-if="renderEffect && currentComponent"
      class="startup-animation__controls"
      :class="{
        'startup-animation__controls--active': startupStore.controlsActive,
        'startup-animation__controls--compact': !startupStore.controlsActive,
        'startup-animation__controls--fading': isFading,
      }"
    >
      <template v-if="startupStore.controlsActive">
        <span class="startup-animation__name">{{ currentEffectLabel }}</span>

        <div class="startup-animation__button-group">
          <button
            type="button"
            class="btn btn-xs btn-ghost btn-square text-white"
            title="Previous animation"
            aria-label="Previous animation"
            @click="selectPreviousEffect"
          >
            <Icon name="kind-icon:chevron-left" class="h-4 w-4" />
          </button>

          <button
            type="button"
            class="btn btn-xs btn-ghost gap-1 text-white"
            title="Choose another random animation"
            @click="selectRandomEffect"
          >
            <Icon name="kind-icon:sparkles" class="h-4 w-4" />
            <span class="hidden sm:inline">Random</span>
          </button>

          <button
            type="button"
            class="btn btn-xs btn-ghost btn-square text-white"
            title="Next animation"
            aria-label="Next animation"
            @click="selectNextEffect"
          >
            <Icon name="kind-icon:chevron-right" class="h-4 w-4" />
          </button>
        </div>

        <div class="startup-animation__divider" />

        <button
          type="button"
          class="btn btn-xs border-white/20 bg-white/10 text-white hover:bg-white/20"
          title="Restore the launch screen and continue loading"
          @click="startupStore.leaveControlMode()"
        >
          Resume
        </button>

        <button
          type="button"
          class="btn btn-xs btn-square border-white/20 bg-black/30 text-white hover:bg-error/70"
          title="Leave startup animation"
          aria-label="Leave startup animation"
          @click="startupStore.requestExit()"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
        </button>
      </template>

      <template v-else>
        <span class="startup-animation__compact-name">
          {{ currentEffectLabel }}
        </span>

        <button
          type="button"
          class="btn btn-xs border-white/20 bg-white/10 text-white hover:bg-white/20"
          title="Pause the launch and explore animations"
          @click="startupStore.enterControlMode()"
        >
          <Icon name="kind-icon:sparkles" class="h-4 w-4" />
          <span>Pause &amp; explore</span>
        </button>
      </template>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getAnimationEffectComponent } from '@/components/screenfx/effect-component-registry'
import type { AnimationEffectId } from '@/stores/animationCatalog'
import { useAnimationStore } from '@/stores/animationStore'
import { useAnimationPreferenceStore } from '@/stores/animationPreferenceStore'
import { useButterflyStore } from '@/stores/butterflyStore'
import { useStartupAnimationStore } from '@/stores/startupAnimationStore'

defineOptions({ inheritAttrs: false })

type StartupBridgeAction =
  | 'explore'
  | 'previous'
  | 'random'
  | 'next'
  | 'resume'
  | 'exit'

type StartupBridgeWindow = Window & {
  __KR_STARTUP_ACTION_QUEUE__?: string[]
}

const HANDOFF_CLASS = 'kr-startup-handoff'
const EFFECT_READY_CLASS = 'kr-startup-effect-ready'
const CONTROLS_READY_CLASS = 'kr-startup-controls-ready'
const BRIDGE_EVENT = 'kr-startup-action'

const animationStore = useAnimationStore()
const preferenceStore = useAnimationPreferenceStore()
const butterflyStore = useButterflyStore()
const startupStore = useStartupAnimationStore()

const resolvedEffectId = ref<AnimationEffectId | null>(null)
const renderEffect = ref(false)
const effectReady = ref(false)
const isFading = ref(false)

const FADE_MS = 650
const HANDOFF_FADE_MS = 340

let fadeTimer: ReturnType<typeof setTimeout> | null = null
let handoffTimer: ReturnType<typeof setTimeout> | null = null

const availableEffectIds = computed(() => {
  return animationStore.safeEffects
    .filter(
      (effect) =>
        !effect.blocksInput && Boolean(getAnimationEffectComponent(effect.id)),
    )
    .map((effect) => effect.id)
})

const currentComponent = computed(() => {
  if (!resolvedEffectId.value) return null
  return getAnimationEffectComponent(resolvedEffectId.value)
})

const currentEffectLabel = computed(() => {
  if (!resolvedEffectId.value) return ''

  return (
    animationStore.effects.find(
      (effect) => effect.id === resolvedEffectId.value,
    )?.label ?? resolvedEffectId.value
  )
})

function clearFadeTimer(): void {
  if (!fadeTimer) return
  clearTimeout(fadeTimer)
  fadeTimer = null
}

function clearHandoffTimer(): void {
  if (!handoffTimer) return
  clearTimeout(handoffTimer)
  handoffTimer = null
}

function finishHandoffIfReady(): void {
  if (!import.meta.client) return

  const root = document.documentElement
  if (!root.classList.contains(EFFECT_READY_CLASS)) return
  if (!root.classList.contains(CONTROLS_READY_CLASS)) return
  if (!root.classList.contains(HANDOFF_CLASS)) return

  clearHandoffTimer()
  handoffTimer = setTimeout(() => {
    root.classList.remove(HANDOFF_CLASS)
    handoffTimer = null
  }, HANDOFF_FADE_MS)
}

function markControlsReady(): void {
  if (!import.meta.client) return
  document.documentElement.classList.add(CONTROLS_READY_CLASS)
  finishHandoffIfReady()
}

function handleEffectReady(): void {
  effectReady.value = true

  if (!import.meta.client) return
  document.documentElement.classList.add(EFFECT_READY_CLASS)
  finishHandoffIfReady()
}

function setEffect(effectId: AnimationEffectId | null): void {
  resolvedEffectId.value = effectId
  renderEffect.value = Boolean(effectId)
  effectReady.value = false
  isFading.value = false

  if (!effectId && import.meta.client) {
    document.documentElement.classList.add(EFFECT_READY_CLASS)
    finishHandoffIfReady()
  }
}

function selectEffect(): void {
  preferenceStore.initialize()
  setEffect(preferenceStore.resolveStartupEffect(availableEffectIds.value))
}

function selectRelativeEffect(direction: -1 | 1): void {
  const ids = availableEffectIds.value
  if (!ids.length) return

  const currentIndex = resolvedEffectId.value
    ? ids.indexOf(resolvedEffectId.value)
    : -1
  const safeIndex = currentIndex < 0 ? 0 : currentIndex
  const nextIndex = (safeIndex + direction + ids.length) % ids.length

  setEffect(ids[nextIndex] ?? ids[0] ?? null)
}

function selectPreviousEffect(): void {
  selectRelativeEffect(-1)
}

function selectNextEffect(): void {
  selectRelativeEffect(1)
}

function selectRandomEffect(): void {
  const ids = availableEffectIds.value
  if (!ids.length) return

  const alternatives = ids.filter((id) => id !== resolvedEffectId.value)
  const pool = alternatives.length ? alternatives : ids
  const index = Math.floor(Math.random() * pool.length)

  setEffect(pool[index] ?? ids[0] ?? null)
}

function applyBridgeAction(action: string): void {
  switch (action as StartupBridgeAction) {
    case 'explore':
      startupStore.enterControlMode()
      break
    case 'previous':
      selectPreviousEffect()
      break
    case 'random':
      selectRandomEffect()
      break
    case 'next':
      selectNextEffect()
      break
    case 'resume':
      startupStore.leaveControlMode()
      break
    case 'exit':
      startupStore.requestExit()
      break
  }
}

function handleBridgeEvent(event: Event): void {
  const action = (event as CustomEvent<string>).detail
  if (typeof action !== 'string') return
  applyBridgeAction(action)
}

function consumeBridgeQueue(): void {
  if (!import.meta.client) return

  const bridgeWindow = window as StartupBridgeWindow
  const queue = bridgeWindow.__KR_STARTUP_ACTION_QUEUE__ ?? []
  bridgeWindow.__KR_STARTUP_ACTION_QUEUE__ = []

  queue.forEach(applyBridgeAction)
}

function fadeOut(): void {
  if (!renderEffect.value || isFading.value) return

  isFading.value = true
  clearFadeTimer()

  fadeTimer = setTimeout(() => {
    renderEffect.value = false
    isFading.value = false
    fadeTimer = null
  }, FADE_MS)
}

startupStore.reset()

if (import.meta.client && butterflyStore.showSwarm) {
  selectEffect()
}

watch(
  () => butterflyStore.showSwarm,
  (visible) => {
    if (visible) {
      clearFadeTimer()
      selectEffect()
      return
    }

    fadeOut()
  },
)

onMounted(() => {
  window.addEventListener(BRIDGE_EVENT, handleBridgeEvent)
  markControlsReady()
  consumeBridgeQueue()
})

onBeforeUnmount(() => {
  clearFadeTimer()
  clearHandoffTimer()

  if (import.meta.client) {
    window.removeEventListener(BRIDGE_EVENT, handleBridgeEvent)
  }
})
</script>

<style scoped>
.startup-animation__stage {
  position: fixed;
  inset: 0;
  z-index: 49;
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
  transition: opacity 320ms ease;
  isolation: isolate;
  will-change: opacity;
}

.startup-animation__stage--ready {
  opacity: 1;
}

.startup-animation__stage--fading {
  opacity: 0;
  transition-duration: 650ms;
}

.startup-animation__effect {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.startup-animation__effect-placeholder {
  position: absolute;
  inset: 0;
}

.startup-animation__controls {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  z-index: 60;
  display: flex;
  width: fit-content;
  max-width: calc(100vw - 2rem);
  align-items: center;
  color: #fff;
  pointer-events: auto;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(0, 0, 0, 0.7);
  box-shadow: 0 0.65rem 1.75rem rgba(0, 0, 0, 0.42);
  opacity: 1;
  backdrop-filter: blur(0.7rem);
  transition:
    opacity 180ms ease,
    border-radius 180ms ease,
    padding 180ms ease,
    gap 180ms ease;
}

.startup-animation__controls--fading {
  opacity: 0;
  pointer-events: none;
}

.startup-animation__controls--compact {
  gap: 0.4rem;
  padding: 0.3rem 0.35rem 0.3rem 0.65rem;
  border-radius: 9999px;
}

.startup-animation__controls--active {
  flex-wrap: wrap;
  gap: 0.3rem;
  padding: 0.42rem;
  border-radius: 0.9rem;
}

.startup-animation__compact-name,
.startup-animation__name {
  overflow: hidden;
  font-size: 0.72rem;
  font-weight: 850;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.startup-animation__compact-name {
  max-width: min(12rem, 42vw);
  color: rgba(255, 255, 255, 0.76);
}

.startup-animation__name {
  max-width: min(14rem, 38vw);
  padding: 0 0.35rem;
  color: #fff;
}

.startup-animation__button-group {
  display: flex;
  align-items: center;
  gap: 0.05rem;
}

.startup-animation__divider {
  width: 1px;
  height: 1.4rem;
  margin: 0 0.1rem;
  background: rgba(255, 255, 255, 0.18);
}

@media (max-width: 639px) {
  .startup-animation__controls--active {
    right: 0.75rem;
    bottom: 0.75rem;
    left: 0.75rem;
    justify-content: center;
    max-width: calc(100vw - 1.5rem);
  }

  .startup-animation__name {
    width: 100%;
    max-width: 100%;
    padding: 0.15rem 0.35rem 0.3rem;
    text-align: center;
  }

  .startup-animation__divider {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .startup-animation__stage,
  .startup-animation__controls {
    transition: none;
  }
}
</style>
