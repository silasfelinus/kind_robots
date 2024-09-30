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
      :class="{ 'is-flipped': !displayStore.showTutorial }"
      @transitionend="handleTransitionEnd"
    >
      <!-- Front side: Splash Tutorial -->
      <div
        class="flip-card-front"
        :class="{ 'invisible': !displayStore.showTutorial && !isFlippedComplete }"
        @transitionend="onFlipOut('splash')"
      >
        <splash-tutorial />
      </div>

      <!-- Back side: NuxtPage content -->
      <div
        class="flip-card-back overflow-y-auto"
        :class="{ 'invisible': displayStore.showTutorial && !isFlippedComplete }"
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
    @click="displayStore.showTutorial = !displayStore.showTutorial"
  >
    {{ displayStore.showTutorial ? 'Launch' : 'Show Instructions' }}
  </button>

  <!-- Full Screen Toggle Button for Large Viewports -->
  <button
    v-if="isLargeViewport"
    class="bg-primary text-base-200 rounded-lg shadow-md hover:bg-primary-focus transition duration-300 z-40 p-1 ml-4"
    @click="displayStore.toggleFullScreen"
  >
    {{ displayStore.isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen' }}
  </button>
</template>


<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Initialize the display store
const displayStore = useDisplayStore()
const mainHeight = computed(() => `calc(var(--vh, 1vh) * ${displayStore.mainVh})`)

// Track if the flip animation has completed
const isFlippedComplete = ref(false)

const handleTransitionEnd = () => {
  // Allow the new side to become interactive after the flip completes
  isFlippedComplete.value = true
}

// Function to handle the completion of the flip-out animation
const onFlipOut = (side) => {
  if (side === 'splash' && !displayStore.showTutorial) {
    // The tutorial side just finished flipping out, make it invisible
    isFlippedComplete.value = false
  }
  if (side === 'nuxt' && displayStore.showTutorial) {
    // The Nuxt page side just finished flipping out, make it invisible
    isFlippedComplete.value = false
  }
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
  /* Ensure visibility and pointer-events are handled properly */
  transition: visibility 0s linear 0.6s, pointer-events 0s linear 0.6s;
}

/* Ensure the outgoing side is invisible after its flip animation ends */
.flip-card-front.invisible,
.flip-card-back.invisible {
  visibility: hidden; /* The non-visible side is hidden after the animation */
  pointer-events: none; /* The non-visible side is non-interactive */
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
