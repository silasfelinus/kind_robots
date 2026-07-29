<!-- /components/screenfx/startup-animation.vue -->
<template>
  <Teleport to="body">
    <div
      v-if="renderEffect && currentComponent"
      class="startup-animation"
      :class="{
        'startup-animation--fading': isFading,
        'startup-animation--immersive': startupStore.immersive,
      }"
    >
      <component
        :is="currentComponent"
        :key="resolvedEffectId"
        class="startup-animation__effect"
        aria-hidden="true"
      />

      <div class="startup-animation__controls">
        <div class="startup-animation__identity">
          <span class="startup-animation__eyebrow">Animation</span>
          <span class="startup-animation__name">{{ currentEffectLabel }}</span>
        </div>

        <div class="startup-animation__button-group">
          <button
            type="button"
            class="btn btn-sm btn-ghost btn-square text-white"
            title="Previous animation"
            aria-label="Previous animation"
            @click="selectPreviousEffect"
          >
            <Icon name="kind-icon:chevron-left" class="h-4 w-4" />
          </button>

          <button
            type="button"
            class="btn btn-sm btn-ghost gap-1 text-white"
            title="Choose another random animation"
            @click="selectRandomEffect"
          >
            <Icon name="kind-icon:sparkles" class="h-4 w-4" />
            <span class="hidden sm:inline">Random</span>
          </button>

          <button
            type="button"
            class="btn btn-sm btn-ghost btn-square text-white"
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
          class="btn btn-sm border-white/20 bg-white/10 text-white hover:bg-white/20"
          :class="{ 'border-primary/70 bg-primary/25': startupStore.immersive }"
          :aria-pressed="startupStore.immersive"
          :title="
            startupStore.immersive
              ? 'Restore the logo and loading messages'
              : 'Hide the logo and loading messages'
          "
          @click="startupStore.toggleImmersive()"
        >
          {{ startupStore.immersive ? 'Show launch UI' : 'Animation only' }}
        </button>

        <button
          type="button"
          class="btn btn-sm btn-square border-white/20 bg-black/30 text-white hover:bg-error/70"
          title="Leave startup animation"
          aria-label="Leave startup animation"
          @click="startupStore.requestExit()"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
        </button>
      </div>
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

const animationStore = useAnimationStore()
const preferenceStore = useAnimationPreferenceStore()
const butterflyStore = useButterflyStore()
const startupStore = useStartupAnimationStore()

const resolvedEffectId = ref<AnimationEffectId | null>(null)
const renderEffect = ref(false)
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

function setEffect(effectId: AnimationEffectId | null): void {
  resolvedEffectId.value = effectId
  renderEffect.value = Boolean(effectId)
  isFading.value = false
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
  startupStore.reset()

  if (butterflyStore.showSwarm) {
    selectEffect()
  }
})

onBeforeUnmount(() => {
  clearFadeTimer()
})
</script>

<style scoped>
.startup-animation {
  position: fixed;
  inset: 0;
  z-index: 49;
  overflow: hidden;
  background: #000;
  pointer-events: none;
  opacity: 1;
  transition: opacity 650ms ease;
  isolation: isolate;
  will-change: opacity;
}

.startup-animation--fading {
  opacity: 0;
}

.startup-animation__effect {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.startup-animation__controls {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  left: 1rem;
  z-index: 100;
  display: flex;
  width: fit-content;
  max-width: calc(100vw - 2rem);
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 1rem;
  background: rgba(0, 0, 0, 0.72);
  color: #fff;
  pointer-events: auto;
  box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(0.75rem);
}

.startup-animation__identity {
  display: flex;
  min-width: 10rem;
  max-width: min(18rem, 55vw);
  flex-direction: column;
  padding: 0 0.45rem;
  line-height: 1.1;
}

.startup-animation__eyebrow {
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.startup-animation__name {
  overflow: hidden;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.startup-animation__button-group {
  display: flex;
  align-items: center;
  gap: 0.1rem;
}

.startup-animation__divider {
  width: 1px;
  height: 1.75rem;
  margin: 0 0.15rem;
  background: rgba(255, 255, 255, 0.2);
}

@media (max-width: 639px) {
  .startup-animation__controls {
    justify-content: center;
  }

  .startup-animation__identity {
    width: 100%;
    max-width: 100%;
    align-items: center;
    text-align: center;
  }

  .startup-animation__divider {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .startup-animation {
    transition: none;
  }
}
</style>
