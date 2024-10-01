<template>
  <div class="effect-container">
    <!-- Loop over active components and render them dynamically -->
    <component
      :is="activeComponent.component"
      v-for="activeComponent in activeComponents"
      :key="activeComponent.id"
      class="absolute inset-0 z-20"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, resolveComponent } from 'vue'

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

// Effect data, each with a unique ID, label, icon, tooltip, and active state
const effects = ref<Array<{ id: EffectId; label: string; isActive: boolean }>>([
  {
    id: 'fizzy-bubbles',
    label: 'Fizzy Lifting',
    isActive: false,
  },
  {
    id: 'bubble-effect',
    label: 'Bubble Fiesta',
    isActive: false,
  },
  {
    id: 'rain-effect',
    label: 'Rainmaker',
    isActive: false,
  },
  {
    id: 'butterfly-animation',
    label: 'Butterfly Scouts',
    isActive: false,
  },
])

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
  z-index: 20; /* Ensure it's between vital elements and the background */
  pointer-events: none; /* Prevent blocking user interaction with elements */
}

.component {
  width: 100%;
  height: 100%;
}
</style>
