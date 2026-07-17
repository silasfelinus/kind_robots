<!-- /components/screenfx/startup-animation.vue -->
<template>
  <Teleport to="body">
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
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getAnimationEffectComponent } from '@/components/screenfx/effect-component-registry'
import type { AnimationEffectId } from '@/stores/animationCatalog'
import { useAnimationStore } from '@/stores/animationStore'
import { useAnimationPreferenceStore } from '@/stores/animationPreferenceStore'
import { useButterflyStore } from '@/stores/butterflyStore'

defineOptions({ inheritAttrs: false })

const animationStore = useAnimationStore()
const preferenceStore = useAnimationPreferenceStore()
const butterflyStore = useButterflyStore()

const resolvedEffectId = ref<AnimationEffectId | null>(null)
const renderEffect = ref(false)
const isFading = ref(false)

const FADE_MS = 650

let fadeTimer: ReturnType<typeof setTimeout> | null = null

const currentComponent = computed(() => {
  if (!resolvedEffectId.value) return null
  return getAnimationEffectComponent(resolvedEffectId.value)
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
      (effect) =>
        !effect.blocksInput && Boolean(getAnimationEffectComponent(effect.id)),
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
  z-index: 100;
  overflow: hidden;
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
</style>
