<template>
  <div
    class="w-full border-accent border-2 rounded-2xl bg-base-300 relative shadow-lg"
    :style="{ height: mainHeight }"
    :class="{ 'grid grid-cols-2 gap-4': isLargeViewport && !displayStore.isFullScreen, 'flip-card': !isLargeViewport || displayStore.isFullScreen }"
  >
    <!-- Flip-card Layout for small viewports or full-screen mode -->
    <div
      v-if="!isLargeViewport || displayStore.isFullScreen"
      class="flip-card-inner"
      :class="{ 'is-flipped': isFlipping && !displayStore.showTutorial }"
      @transitionend="handleTransitionEnd"
    >
      <!-- Front side: Splash Tutorial -->
      <div
        v-show="isFlipping || displayStore.showTutorial" <!-- Show splash during flip or when selected -->
        class="flip-card-front"
        @transitionend="onFlipOut('splash')"
      >
        <splash-tutorial />
      </div>

      <!-- Back side: NuxtPage content -->
      <div
        v-show="isFlipping || !displayStore.showTutorial" <!-- Show NuxtPage during flip or when selected -->
        class="flip-card-back overflow-y-auto"
        @transitionend="onFlipOut('nuxt')"
      >
        <NuxtPage />
      </div>
    </div>

    <!-- Two-column layout for large viewports when not in full-screen mode -->
    <div
      v-if="isLargeViewport && !displayStore.isFullScreen"
      class="flex flex-col overflow-y-auto"
      :style="{ height: '100%' }"
    >
      <splash-tutorial />
    </div>
    <div
      v-if="isLargeViewport && !displayStore.isFullScreen"
      class="flex flex-col overflow-y-auto border rounded-2xl"
      :style="{ height: '100%' }"
    >
      <NuxtPage />
    </div>
  </div>

  <!-- Full-Screen Control Button -->
  <button
    v-if="displayStore.isFullScreen"
    class="bg-secondary text-base-100 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300 z-50 fixed bottom-4 right-4 p-3"
    @click="toggleContent"
  >
    {{ displayStore.showTutorial ? 'Launch' : 'Show Instructions' }}
  </button>

  <!-- Full Screen Toggle Button for Large Viewports -->
  <button
    v-if="isLargeViewport"
    class="bg-primary text-base-200 rounded-lg shadow-md hover:bg-primary-focus transition duration-300 z-40 p-1 ml-4"
    @click="displayStore.toggleFullScreen"
  >
    {{ displayStore.isFullScreen ? 'Two Columns' : 'Full Screen' }}
  </button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Initialize the display store
const displayStore = useDisplayStore()
const mainHeight = computed(() => `calc(var(--vh, 1vh) * ${displayStore.mainVh})`)

// Track if the flip animation is happening
const isFlipping = ref(false)

const handleTransitionEnd = () => {
  isFlipping.value = false // Stop flipping once the animation completes
}

const onFlipOut = (side) => {
  if (side === 'splash' && !displayStore.showTutorial) {
    isFlipping.value = false
  }
  if (side === 'nuxt' && displayStore.showTutorial) {
    isFlipping.value = false
  }
}

// Toggle between showing the splash tutorial and the main content
const toggleContent = () => {
  isFlipping.value = true // Start flipping animation
  displayStore.showTutorial = !displayStore.showTutorial
}

// Ensure that we always start on the splash tutorial page
onMounted(() => {
  displayStore.showTutorial = true // Set to true to always start with splash tutorial
})
</script>

<style scoped>
/* Flip card container */
.flip-card {
  width: 100%;
  height: 100%; /* Match the height of its parent container */
  perspective: 1000px; /* 3D perspective for the flip */
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
  backface-visibility: hidden; /* Hide the back during the flip */
  -webkit-backface-visibility: hidden; /* Ensure hidden backface on WebKit browsers */
  border-radius: 12px;
  display: flex;
  flex-direction: column;
}

/* Hide non-visible side once flip animation is done */
.flip-card-front[style*='display: none'],
.flip-card-back[style*='display: none'] {
  visibility: hidden;
  pointer-events: none;
}

.flip-card-back {
  transform: rotateY(180deg); /* Back side of the card */
  overflow-y: auto; /* Scrollable content if needed */
}

/* Two-column layout should respect height */
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
