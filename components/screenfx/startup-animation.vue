<!-- /components/screenfx/startup-animation.vue -->
<template>
  <div
    v-if="renderEffect && currentComponent"
    class="startup-animation"
    :class="{ 'startup-animation--fading': isFading }"
    aria-hidden="true"
  >
    <component
      :is="currentComponent"
      :key="resolvedEffectId"
      class="startup-animation__effect"
    />
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  resolveComponent,
  watch,
} from 'vue'
import { useAnimationStore, type AnimationEffectId } from '@/stores/animationStore'
import { useAnimationPreferenceStore } from '@/stores/animationPreferenceStore'
import { useButterflyStore } from '@/stores/butterflyStore'

const animationStore = useAnimationStore()
const preferenceStore = useAnimationPreferenceStore()
const butterflyStore = useButterflyStore()

const resolvedEffectId = ref<AnimationEffectId | null>(null)
const renderEffect = ref(false)
const isFading = ref(false)

const FADE_MS = 650

let fadeTimer: ReturnType<typeof setTimeout> | null = null

const componentsMap: Partial<
  Record<AnimationEffectId, ReturnType<typeof resolveComponent>>
> = {
  'starfield-effect': resolveComponent('LazyStarfieldEffect'),
  'constellation-effect': resolveComponent('LazyConstellationEffect'),
  'wishing-stars': resolveComponent('LazyWishingStars'),
  'orbit-effect': resolveComponent('LazyOrbitEffect'),
  'butterfly-animation': resolveComponent('LazyButterflyAnimation'),
  'firefly-effect': resolveComponent('LazyFireflyEffect'),
  'rain-effect': resolveComponent('LazyRainEffect'),
  'snow-effect': resolveComponent('LazySnowEffect'),
  'floating-hearts': resolveComponent('LazyFloatingHearts'),
  'fizzy-bubbles': resolveComponent('LazyFizzyBubbles'),
  'ripple-effect': resolveComponent('LazyRippleEffect'),
  'fireworks-effect': resolveComponent('LazyFireworksEffect'),
  'lightning-effect': resolveComponent('LazyLightningEffect'),
  'fire-effect': resolveComponent('LazyFireEffect'),
  'glitch-effect': resolveComponent('LazyGlitchEffect'),
  'kaleidoscope-effect': resolveComponent('LazyKaleidoscopeEffect'),
  'plasma-effect': resolveComponent('LazyPlasmaEffect'),
  'nyan-trail': resolveComponent('LazyNyanTrail'),
  'matrix-rain': resolveComponent('LazyMatrixRain'),
  'pixel-rain': resolveComponent('LazyPixelRain'),
  'pixel-explosion': resolveComponent('LazyPixelExplosion'),
  'wandering-creatures': resolveComponent('LazyWanderingCreatures'),
  'toaster-effect': resolveComponent('LazyToasterEffect'),
  'ascii-aquarium': resolveComponent('LazyAsciiAquarium'),
  'pacbot-effect': resolveComponent('LazyPacbotEffect'),
  'pocket-gremlin': resolveComponent('LazyPocketGremlin'),
  'siege-engine': resolveComponent('LazySiegeEngine'),
}

const currentComponent = computed(() => {
  if (!resolvedEffectId.value) return null
  return componentsMap[resolvedEffectId.value] || null
})

function clearFadeTimer(): void {
  if (!fadeTimer) return
  clearTimeout(fadeTimer)
  fadeTimer = null
}

function selectEffect(): void {
  preferenceStore.initialize()

  const availableIds = animationStore.safeEffects
    .filter(
      (effect) => !effect.blocksInput && componentsMap[effect.id] !== undefined,
    )
    .map((effect) => effect.id)

  resolvedEffectId.value = preferenceStore.resolveStartupEffect(availableIds)
  renderEffect.value = Boolean(resolvedEffectId.value)
  isFading.value = false
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
  selectEffect()
})

onBeforeUnmount(() => {
  clearFadeTimer()
})
</script>

<style scoped>
.startup-animation {
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow: hidden;
  pointer-events: none;
  opacity: 1;
  transition: opacity 650ms ease;
  transform: translateZ(0);
  contain: layout paint style;
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
</style>
