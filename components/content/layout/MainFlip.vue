<template>
  <div
    class="w-full border-accent border-2 rounded-2xl bg-base-300 relative shadow-lg"
    :style="{ height: mainHeight }" <!-- Constrain the height using mainHeight from the store -->
    :class="{ 'grid grid-cols-2 gap-4': isLargeViewport, 'flip-card': !isLargeViewport }"
  >
    <!-- Flip-card Layout for small and medium viewports -->
    <div
      v-if="!isLargeViewport"
      class="flip-card-inner"
      :class="{ 'is-flipped': !displayStore.showTutorial }"
    >
      <!-- Front side: Splash Tutorial -->
      <div class="flip-card-front">
        <splash-tutorial />
      </div>

      <!-- Back side: NuxtPage content -->
      <div class="flip-card-back overflow-y-auto">
        <NuxtPage />
      </div>
    </div>

    <!-- Two-column layout for large and extra-large viewports -->
    <div
      v-if="isLargeViewport"
      class="flex flex-col overflow-y-auto"
      :style="{ height: '100%' }"
    >
      <splash-tutorial />
    </div>
    <div
      v-if="isLargeViewport"
      class="flex flex-col overflow-y-auto border rounded-2xl"
      :style="{ height: '100%' }"
    >
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Initialize the display store
const displayStore = useDisplayStore()
const mainHeight = computed(() => `calc(var(--vh, 1vh) * ${displayStore.mainVh})`)

// Watch for changes in viewport size to control flip-card or two-column layout
const isLargeViewport = computed(() => 
  displayStore.viewportSize === 'large' || displayStore.viewportSize === 'extraLarge'
)
</script>

<style scoped>
/* Ensure the main content respects the boundaries */
.flip-card {
  width: 100%;
  height: 100%; /* Match the height of its parent container */
  perspective: 1000px; /* 3D perspective for flip animation */
}

.flip-card-inner {
  width: 100%;
  height: 100%; /* Ensure it stays within the parent height */
  transition: transform 0.6s ease-in-out; /* Smooth flip animation */
  transform-style: preserve-3d; /* 3D space for the flip */
  position: relative;
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg); /* Trigger flip on the Y-axis */
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden; /* Hide back side during flip */
  -webkit-backface-visibility: hidden; /* WebKit browsers */
  border-radius: 12px;
  display: flex;
  flex-direction: column;
}

.flip-card-back {
  transform: rotateY(180deg); /* Back side of the card */
  overflow-y: auto; /* Scrollable content if needed */
}

/* Two-column layout should also respect height */
.grid-cols-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  height: 100%; /* Ensure the two-column layout respects the container height */
}

/* Ensure border for main content */
.w-full.border-accent {
  border-color: var(--tw-border-opacity) var(--tw-border-opacity);
  border-width: 2px;
}
</style>
