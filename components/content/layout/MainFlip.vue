<template>
  <div
    class="w-full border-accent md:border-2 rounded-2xl bg-base-300 relative shadow-lg"
    :style="{ height: mainHeight }"
    :class="{ 'grid grid-cols-2 gap-4': isLargeViewport, 'flip-card': !isLargeViewport }"
  >
    <!-- Flip-card Layout for small and medium viewports -->
    <div
      v-if="!isLargeViewport"
      class="flip-card-inner"
      :class="{ 'is-flipped': !displayStore.showTutorial }"
      @transitionend="handleTransitionEnd"
    >
      <!-- Front side: Splash Tutorial -->
      <div class="flip-card-front" :class="{ 'invisible': displayStore.showTutorial }">
        <splash-tutorial />
      </div>

      <!-- Back side: NuxtPage content -->
      <div class="flip-card-back overflow-y-auto" :class="{ 'invisible': !displayStore.showTutorial }">
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
import { ref, computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Initialize the display store
const displayStore = useDisplayStore()
const mainHeight = computed(() => `calc(var(--vh, 1vh) * ${displayStore.mainVh})`)

// Track if the animation is complete
const isFlippedComplete = ref(false)

const handleTransitionEnd = () => {
  isFlippedComplete.value = true
}
</script>

<style scoped>
/* Ensure the main content respects the boundaries */
.flip-card {
  width: 100%;
  height: 100%; /* Match the height of its parent container */
  perspective: 1000px;
}

.flip-card-inner {
  width: 100%;
  height: 100%; /* Ensure it stays within the parent height */
  transition: transform 0.6s ease-in-out; /* Smooth flip animation */
  transform-style: preserve-3d; /* 3D space for the flip */
  position: relative;
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg); /* Flip the card */
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden; /* Hide the back side when it's flipped */
  -webkit-backface-visibility: hidden; /* WebKit browsers */
  display: flex;
  flex-direction: column;
  transition: visibility 0s linear 0.6s, pointer-events 0s linear 0.6s;
}

.flip-card-front.invisible,
.flip-card-back.invisible {
  visibility: hidden;
  pointer-events: none; /* Make the invisible side non-interactive */
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


</style>
