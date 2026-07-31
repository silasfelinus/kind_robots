<!-- /components/screenfx/startup-animation.vue -->
<template>
  <Teleport to="body">
    <div
      v-if="renderEffect && currentComponent"
      class="startup-animation__stage"
      :class="{
        'startup-animation__stage--ready': effectReady,
        'startup-animation__stage--immersive': startupStore.immersive,
        'startup-animation__stage--fading': isFading,
      }"
    >
      <Suspense
        :key="resolvedEffectId ?? 'startup-effect'"
        @resolve="handleEffectReady"
      >
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
      v-if="showControls"
      class="startup-animation__controls"
      :class="{
        'startup-animation__controls--active': startupStore.controlsActive,
        'startup-animation__controls--compact': !startupStore.controlsActive,
        'startup-animation__controls--fading': isFading,
      }"
    >
      <template v-if="startupStore.controlsActive">
        <span class="startup-animation__name">{{ displayEffectLabel }}</span>

        <div class="startup-animation__button-group">
          <button
            type="button"
            class="btn btn-xs btn-ghost btn-square text-white"
            title="Previous animation"
            aria-label="Previous animation"
            :disabled="!hasSelectableEffects"
            @click="selectPreviousEffect"
          >
            <Icon name="kind-icon:chevron-left" class="h-4 w-4" />
          </button>

          <button
            type="button"
            class="btn btn-xs btn-ghost gap-1 text-white"
            title="Choose another random animation"
            :disabled="!hasSelectableEffects"
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
            :disabled="!hasSelectableEffects"
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
          {{ displayEffectLabel }}
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
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { getAnimationEffectComponent } from '@/components/screenfx/effect-component-registry'
import type { AnimationEffectId } from '@/stores/animationCatalog'
import { useAnimationStore } from '@/stores/animationStore'
import { useAnimationPreferenceStore } from '@/stores/animationPreferenceStore'
import { useButterflyStore } from '@/stores/butterflyStore'
import { useStartupAnimationStore } from '@/stores/startupAnimationStore'

defineOptions({ inheritAttrs: false })

const animationStore = useAnimationStore()
const preferenceStore = useAnimationPreferenceStore()
const butterflyStore = useButterflyStore()
const startupStore = useStartupAnimationStore()

const resolvedEffectId = ref<AnimationEffectId | null>(null)
const renderEffect = ref(false)
const effectReady = ref(false)
const isFading = ref(false)

const FADE_MS = 650

let fadeTimer: ReturnType<typeof setTimeout> | null = null

const availableEffectIds = computed(() => {
  return animationStore.safeEffects
    .filter(
      (effect) =>
        !effect.blocksInput && Boolean(getAnimationEffectComponent(effect.id)),
    )
    .map((effect) => effect.id)
})

const hasSelectableEffects = computed(() => availableEffectIds.value.length > 0)

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

const displayEffectLabel = computed(
  () => currentEffectLabel.value || 'Preparing animation…',
)

const showControls = computed(() => {
  return (
    butterflyStore.showSwarm ||
    renderEffect.value ||
    startupStore.immersive ||
    isFading.value
  )
})

function clearFadeTimer(): void {
  if (!fadeTimer) return
  clearTimeout(fadeTimer)
  fadeTimer = null
}

function setEffect(effectId: AnimationEffectId | null): void {
  resolvedEffectId.value = effectId
  renderEffect.value = Boolean(effectId)
  effectReady.value = false
  isFading.value = false
}

function handleEffectReady(): void {
  effectReady.value = true
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

/*
 * Explore mode belongs to this component, not to the loader backdrop. App.vue
 * may finish booting underneath while the user browses startup effects. If the
 * loader is retired by its outer failsafe, immersive mode must therefore keep
 * both the selected effect and an opaque black stage alive until Resume/Exit.
 */
watch(
  [
    () => butterflyStore.showSwarm,
    () => startupStore.immersive,
    availableEffectIds,
  ],
  ([visible, immersive]) => {
    if (visible || immersive) {
      clearFadeTimer()

      if (!renderEffect.value || !resolvedEffectId.value) {
        selectEffect()
      }

      return
    }

    fadeOut()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearFadeTimer()
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
  transition:
    opacity 320ms ease,
    background-color 180ms ease;
  isolation: isolate;
  will-change: opacity;
}

.startup-animation__stage--ready {
  opacity: 1;
}

/*
 * Once Pause & explore is active the stage becomes the screensaver surface.
 * It must remain opaque even if the normal loader finishes underneath it.
 */
.startup-animation__stage--immersive {
  background: #000;
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
