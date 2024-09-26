<template>
  <div
    class="w-full rounded-2xl bg-base-300 relative shadow-lg"
    :class="{
      'grid grid-cols-2 gap-4': isLargeViewport,
      'flip-card':
        displayStore.viewportSize !== 'large' &&
        displayStore.viewportSize !== 'extraLarge',
    }"
  >
    <!-- Flip-card Layout for small and medium viewports -->
    <div
      v-if="
        displayStore.viewportSize !== 'large' &&
        displayStore.viewportSize !== 'extraLarge'
      "
      class="flip-card-inner"
      :class="{ 'is-flipped': !displayStore.showTutorial }"
    >
      <!-- Front side: Splash Tutorial -->
      <div class="flip-card-front">
        <splash-tutorial />
      </div>

      <!-- Back side: NuxtPage content (with scrolling) -->
      <div class="flip-card-back overflow-y-auto">
        <NuxtPage />
      </div>
    </div>

    <!-- Two-column layout for large and extra-large viewports -->
    <div v-if="isLargeViewport" class="flex flex-col overflow-y-auto">
      <splash-tutorial />
    </div>
    <div v-if="isLargeViewport" class="flex flex-col overflow-y-auto">
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// We can also use a computed property if we need further complex logic
const isLargeViewport = computed(() => {
  return (
    displayStore.viewportSize === 'large' ||
    displayStore.viewportSize === 'extraLarge'
  )
})
</script>

<style scoped>
.flip-card {
  width: 100%;
  height: 100%;
  perspective: 1000px;
}

.flip-card-inner {
  width: 100%;
  height: 100%;
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d;
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 12px;
}

.flip-card-front {
  z-index: 2;
}

.flip-card-back {
  transform: rotateY(180deg);
  overflow-y: auto; /* Enable vertical scrolling */
}

/* Two-column layout when viewport is large or extra large */
.grid-cols-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}
</style>
