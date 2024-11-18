<template>
  <div
    class="effect-container"
    :class="{ 'fade-out': fadeOut }"
    :style="containerStyles"
  >
    <!-- Loop over active components and render them dynamically based on currentAnimation -->
    <component
      :is="currentComponent"
      v-if="currentComponent"
      class="absolute inset-0 z-50"
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

// Map of animation components and their corresponding display type (fullscreen or main)
const componentsMap: Record<
  EffectId,
  {
    component: string | ReturnType<typeof resolveComponent>
    isFullscreen: boolean
  }
> = {
  'bubble-effect': {
    component: resolveComponent('LazyBubbleEffect'),
    isFullscreen: true,
  },
  'fizzy-bubbles': {
    component: resolveComponent('LazyFizzyBubbles'),
    isFullscreen: true,
  },
  'rain-effect': {
    component: resolveComponent('LazyRainEffect'),
    isFullscreen: true,
  },
  'butterfly-animation': {
    component: resolveComponent('LazyButterflyAnimation'),
    isFullscreen: false,
  },
}

// Computed property to get the active component based on the current animation
const currentComponent = computed(() => {
  const animationId = displayStore.currentAnimation as EffectId
  return componentsMap[animationId]?.component || null
})

// Computed property to check if the current animation should be fullscreen or not
const isFullscreen = computed(() => {
  const animationId = displayStore.currentAnimation as EffectId
  return componentsMap[animationId]?.isFullscreen ?? true // Default to fullscreen if not defined
})

// Dynamic container styles based on whether the animation is fullscreen or constrained to main content
const containerStyles = computed(() => {
  if (!isFullscreen.value) {
    // Constrain to the main content area
    return {
      width: displayStore.mainVw + 'vw',
      height: displayStore.mainVh + 'vh',
      top: displayStore.headerHeight,
      left: displayStore.sidebarLeftWidth,
    }
  } else {
    // Fullscreen
    return {
      width: '100vw',
      height: '100vh',
    }
  }
})

// Watch for changes in the isAnimating state from displayStore
watch(
  () => displayStore.isAnimating,
  (newValue) => {
    if (newValue) {
      fadeOut.value = false // Reset fade-out when animation starts
    } else {
      setTimeout(() => {
        fadeOut.value = true // Trigger fade-out after a small delay
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
