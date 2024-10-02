<template>
  <div class="effect-container" :class="{ 'fade-out': fadeOut }">
    <!-- Loop over active components and render them dynamically -->
    <component
      :is="activeComponent.component"
      v-for="activeComponent in activeComponents"
      :key="activeComponent.id"
      class="absolute inset-0 z-40"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

type EffectId =
  | 'bubble-effect'
  | 'fizzy-bubbles'
  | 'rain-effect'
  | 'butterfly-animation'

// Map of animation components that can be toggled on
const componentsMap = {
  'bubble-effect': resolveComponent('LazyBubbleEffect'),
  'fizzy-bubbles': resolveComponent('LazyFizzyBubbles'),
  'rain-effect': resolveComponent('LazyRainEffect'),
  'butterfly-animation': resolveComponent('LazyButterflyAnimation'),
}

// Effect data, each with a unique ID, label, and active state
const effects = ref<Array<{ id: EffectId; label: string; isActive: boolean }>>([
  { id: 'fizzy-bubbles', label: 'Fizzy Lifting', isActive: false },
  { id: 'bubble-effect', label: 'Bubble Fiesta', isActive: false },
  { id: 'rain-effect', label: 'Rainmaker', isActive: false },
  { id: 'butterfly-animation', label: 'Butterfly Scouts', isActive: false },
])

const fadeOut = ref(false) // Controls fade-out for the container

// Function to randomly pick an animation and start it
const startRandomAnimation = () => {
  stopAnimations() // Stop any ongoing animations
  const randomIndex = Math.floor(Math.random() * effects.value.length)
  const selectedEffect = effects.value[randomIndex]
  startAnimation(selectedEffect.id)
}

// Function to start a specific animation
const startAnimation = (animationId: EffectId) => {
  effects.value.forEach((effect) => {
    effect.isActive = effect.id === animationId
  })
}

// Function to stop all animations and trigger fade-out
const stopAnimations = () => {
  effects.value.forEach((effect) => {
    effect.isActive = false
  })
}

// Watch for changes in the isAnimating state from displayStore
const displayStore = useDisplayStore()

watch(
  () => displayStore.isAnimating,
  (newValue) => {
    if (newValue) {
      // When animation starts, reset fade-out and trigger a random animation
      fadeOut.value = false
      startRandomAnimation()
    } else {
      // When animation stops, stop animations and trigger the fade-out
      stopAnimations()
      setTimeout(() => {
        fadeOut.value = true // Fade out after a small delay
      }, 1000) // Adjust the delay based on the animation duration
    }
  },
)

// Computed property to get active components (only active effects)
const activeComponents = computed(() => {
  return effects.value
    .filter((effect) => effect.isActive)
    .map((effect) => ({
      id: effect.id,
      component: componentsMap[effect.id],
    }))
})
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
