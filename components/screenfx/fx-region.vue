<!-- /components/content/screenfx/fx-region.vue -->
<template>
  <div
    v-if="isMounted && behindEntries.length"
    class="fx-surface fx-surface--behind"
    aria-hidden="true"
  >
    <component
      :is="entry.component"
      v-for="entry in behindEntries"
      :key="entry.key"
    />
  </div>

  <div
    v-if="isMounted && frontEntries.length"
    class="fx-surface fx-surface--front"
    :class="{ 'fx-surface--interactive': frontInteractive }"
    aria-hidden="true"
  >
    <component
      :is="entry.component"
      v-for="entry in frontEntries"
      :key="entry.key"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, resolveComponent } from 'vue'
import {
  useAnimationStore,
  type AnimationEffectId,
  type FxPlacement,
  type FxRegion,
} from '@/stores/animationStore'

const props = defineProps<{
  region: FxRegion
}>()

const animationStore = useAnimationStore()

const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
})

type ComponentMap = Record<
  AnimationEffectId,
  ReturnType<typeof resolveComponent>
>

const componentsMap: ComponentMap = {
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

interface SurfaceEntry {
  key: string
  id: AnimationEffectId
  component: ReturnType<typeof resolveComponent>
}

function entriesForPlacement(placement: FxPlacement): SurfaceEntry[] {
  const entries: SurfaceEntry[] = []
  const seen = new Set<AnimationEffectId>()

  if (animationStore.screenSurfaces[props.region][placement]) {
    animationStore.screenEffects.forEach((effect) => {
      const component = componentsMap[effect.id]

      if (!component || seen.has(effect.id)) return

      seen.add(effect.id)
      entries.push({ key: `fx-${effect.id}`, id: effect.id, component })
    })
  }

  const generationActive =
    animationStore.isActive &&
    animationStore.activeEffectId &&
    animationStore.generationSurfaces[props.region][placement]

  if (generationActive && animationStore.activeEffectId) {
    const id = animationStore.activeEffectId
    const component = componentsMap[id]

    if (component && !seen.has(id)) {
      entries.push({ key: `gen-${id}`, id, component })
    }
  }

  return entries
}

const behindEntries = computed(() => entriesForPlacement('behind'))
const frontEntries = computed(() => entriesForPlacement('front'))

const frontInteractive = computed(() => {
  return (
    animationStore.screenSurfaces[props.region].front &&
    animationStore.hasBlockingScreenEffect
  )
})
</script>

<style scoped>
.fx-surface {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;

  /* Traps position: fixed effect children inside the region and clips them */
  transform: translateZ(0);
  contain: layout paint;
}

/*
 * Paints above the region's own background but below its normal-flow content.
 * The region's content children all carry z-index >= 1 (z-10, z-70, etc.),
 * so a z-index of 0 here sits above the opaque region background and below
 * that content. A negative z-index would hide behind the background and
 * render the effect invisible.
 */
.fx-surface--behind {
  z-index: 0;
}

.fx-surface--front {
  z-index: 50;
}

.fx-surface--interactive {
  pointer-events: auto;
}
</style>
