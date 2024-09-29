<template>
  <div
    class="w-full border-accent border-2 rounded-2xl bg-base-300 relative shadow-lg"
    :style="{
      height: mainHeight, // Constrain the height using mainHeight from the store
    }"
    :class="{
      'grid grid-cols-2 gap-4': isLargeViewport,
      'flip-card': !isLargeViewport,
    }"
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
        <NuxtPage></NuxtPage>
      </div>
    </div>

    <!-- Two-column layout for large and extra-large viewports -->
    <div
      v-if="isLargeViewport"
      class="flex flex-col overflow-y-auto border border-accent rounded-2xl p-1"
      :style="{ height: '100%' }"
    >
      <splash-tutorial />
    </div>
    <div
      v-if="isLargeViewport"
      class="flex flex-col overflow-y-auto"
      :style="{ height: '100%' }"
    >
      <NuxtPage></NuxtPage>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Initialize the display store
const displayStore = useDisplayStore()

const mainHeight = computed(
  () => `calc(var(--vh, 1vh) * ${displayStore.mainVh})`,
)

// Watch for changes in viewport size
const isLargeViewport = computed(
  () =>
    displayStore.viewportSize === 'large' ||
    displayStore.viewportSize === 'extraLarge',
)

// Ensure initialization happens on component mount
onMounted(() => {
  if (!displayStore.isInitialized) {
    displayStore.initialize()
  }
})
</script>

<style>
.flip-card {
  perspective: 1000px;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden; /* Ensure no overflow on small screens */
}

.flip-card-inner {
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d;
  width: 100%;
  height: 100%;
  position: relative;
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg); /* Flips the card to show the back side */
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden; /* Prevent backside visibility */
  -webkit-backface-visibility: hidden; /* For Webkit browsers */
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevents content from overflowing */
}

.flip-card-front {
  transform: rotateY(0deg); /* Front side shown by default */
}

.flip-card-back {
  transform: rotateY(180deg); /* Back side starts flipped */
  overflow-y: auto; /* Allows scrolling if content exceeds height */
}

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
