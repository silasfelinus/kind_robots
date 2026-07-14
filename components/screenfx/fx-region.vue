<!-- /components/screenfx/fx-region.vue -->
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
  getAnimationComponentName,
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

const componentsMap = new Map<
  AnimationEffectId,
  ReturnType<typeof resolveComponent>
>(
  animationStore.effects.map((effect) => [
    effect.id,
    resolveComponent(getAnimationComponentName(effect.id)),
  ]),
)

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
      const component = componentsMap.get(effect.id)

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
    const component = componentsMap.get(id)

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
  transform: translateZ(0);
  contain: layout paint;
}

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
