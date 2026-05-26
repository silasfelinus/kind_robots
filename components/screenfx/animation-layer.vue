<!-- /components/content/animation/animation-layer.vue -->
<template>
  <Teleport to="body">
    <Transition name="animation-layer-fade">
      <section
        v-if="animationStore.isActive && activeComponent"
        class="pointer-events-none fixed z-83 overflow-hidden rounded-2xl border border-primary/20 bg-base-300/10 shadow-2xl backdrop-blur-[1px]"
        :style="animationStore.layerStyle"
        aria-live="polite"
      >
        <div class="absolute inset-0 z-83 pointer-events-none">
          <component :is="activeComponent" />
        </div>

        <div
          class="pointer-events-auto absolute bottom-4 left-1/2 z-84 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-base-300 bg-base-100/90 px-4 py-3 text-sm font-bold text-base-content shadow-xl backdrop-blur-md"
        >
          <span class="loading loading-spinner loading-sm text-primary" />

          <Icon
            :name="animationStore.activeEffect?.icon || 'kind-icon:sparkles'"
            class="h-5 w-5 shrink-0 text-secondary"
          />

          <animation-controls class="pointer-events-auto shrink-0" />

          <span class="min-w-0 truncate">
            {{ animationStore.message || 'Generating art...' }}
          </span>
        </div>
      </section>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
// /components/content/animation/animation-layer.vue
import { computed, resolveComponent } from 'vue'
import {
  useAnimationStore,
  type AnimationEffectId,
} from '@/stores/animationStore'

type ComponentMap = Record<
  AnimationEffectId,
  ReturnType<typeof resolveComponent>
>

const animationStore = useAnimationStore()

const componentsMap: ComponentMap = {
  'aurora-effect': resolveComponent('LazyAuroraEffect'),
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

const activeComponent = computed(() => {
  const effectId = animationStore.activeEffectId
  return effectId ? componentsMap[effectId] : null
})
</script>

<style scoped>
.animation-layer-fade-enter-active,
.animation-layer-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.animation-layer-fade-enter-from,
.animation-layer-fade-leave-to {
  opacity: 0;
  transform: scale(0.985);
}

.animation-layer-fade-enter-to,
.animation-layer-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
