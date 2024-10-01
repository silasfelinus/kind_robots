<template>
  <div
    class="w-full md:border-accent-200 md:border-2 rounded-2xl bg-base-300 relative shadow-lg"
    :style="{ height: mainHeight }"
  >
    <!-- Flip-card Layout: For full-screen mode or non-large viewports -->
    <div
      v-if="!displayStore.isLargeViewport || displayStore.isFullScreen"
      class="flip-card-inner"
      :class="{ 'is-flipped': !displayStore.showTutorial }"
      @transitionend="handleTransitionEnd"
    >
      <div
        class="flip-card-front"
        :class="{ invisible: !displayStore.showTutorial && !isFlippedComplete }"
        @transitionend="onFlipOut('splash')"
      >
        <splash-tutorial />
      </div>

      <div
        class="flip-card-back overflow-y-auto"
        :class="{ invisible: displayStore.showTutorial && !isFlippedComplete }"
        @transitionend="onFlipOut('nuxt')"
      >
        <NuxtPage />
      </div>
    </div>

    <!-- Two-column mode is handled outside in App.vue, but we still need to show the content -->
    <div v-else>
      <!-- No special layout needed for two-column mode here -->
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Initialize the display store
const displayStore = useDisplayStore()
const mainHeight = computed(() => displayStore.mainHeight)

// Track if the flip animation has completed
const isFlippedComplete = ref(false)

const handleTransitionEnd = () => {
  // Allow the new side to become interactive after the flip completes
  isFlippedComplete.value = true
}

const onFlipOut = (side: string) => {
  if (side === 'splash' && !displayStore.showTutorial) {
    isFlippedComplete.value = false
  } else if (side === 'nuxt' && displayStore.showTutorial) {
    isFlippedComplete.value = false
  }
}
</script>

<style scoped>
/* Add a simple fade-in effect */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  opacity: 0;
}

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
  transition:
    visibility 0s linear 0.6s,
    pointer-events 0s linear 0.6s;
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
</style>
