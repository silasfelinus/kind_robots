<template>
  <div class="effect-container" :class="{ 'fade-out': fadeOut }">
    <!-- Loop over active components and render them dynamically based on currentAnimation -->
    <component
      :is="currentComponent"
      v-if="currentComponent"
      class="absolute inset-0 z-40"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import type { EffectId } from '@/stores/displayStore' // Ensure EffectId is correctly typed

// Fetch the display store
const displayStore = useDisplayStore()

const fadeOut = ref(false) // Controls fade-out for the container

// Map of animation components that can be toggled on
const componentsMap: Record<
  EffectId,
  string | ReturnType<typeof resolveComponent>
> = {
  'bubble-effect': resolveComponent('LazyBubbleEffect'),
  'fizzy-bubbles': resolveComponent('LazyFizzyBubbles'),
  'rain-effect': resolveComponent('LazyRainEffect'),
  'butterfly-animation': resolveComponent('LazyButterflyAnimation'),
}

// Computed property to get the active component based on the current animation
const currentComponent = computed(() => {
  const animationId = displayStore.currentAnimation as EffectId
  return componentsMap[animationId] || null
})

// Watch for changes in the isAnimating state from displayStore
watch(
  () => displayStore.isAnimating,
  (newValue) => {
    if (newValue) {
      // When animation starts, reset fade-out and display the current animation
      fadeOut.value = false
    } else {
      // When animation stops, trigger the fade-out
      setTimeout(() => {
        fadeOut.value = true // Fade out after a small delay
      }, 1000)
    }
  },
)
</script>

<style scoped>
.effect-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 40;
  pointer-events: none;
  transition: opacity 1s;
}

.effect-container.fade-out {
  opacity: 0;
}

.effect-container:not(.fade-out) {
  opacity: 1;
}

.component {
  width: 100%;
  height: 100%;
}
</style>
