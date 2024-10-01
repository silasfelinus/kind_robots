<template>
  <div class="w-full md:border-accent-200 md:border-2 rounded-2xl bg-base-300 relative shadow-lg" :style="{ height: mainHeight }">
    <!-- Handle full-screen or non-large viewports with flip-card layout -->
    <div v-if="!displayStore.isLargeViewport || displayStore.isFullScreen" class="flip-card-inner" :class="{ 'is-flipped': !displayStore.showTutorial }" @transitionend="handleTransitionEnd">
      <div class="flip-card-front" :class="{ invisible: !displayStore.showTutorial && !isFlippedComplete }">
        <splash-tutorial />
      </div>
      <div class="flip-card-back overflow-y-auto" :class="{ invisible: displayStore.showTutorial && !isFlippedComplete }">
        <NuxtPage />
      </div>
    </div>

    <!-- Two-column mode for large viewports -->
    <div v-else class="grid grid-cols-2 gap-4" :style="{ height: '100%' }">
      <div class="flex flex-col overflow-y-auto h-full">
        <splash-tutorial />
      </div>
      <div class="flex flex-col overflow-y-auto h-full border rounded-2xl">
        <NuxtPage />
      </div>
    </div>
  </div>

  <!-- Full-Screen Control Button (optional) -->
  <button v-if="displayStore.isFullScreen" class="bg-secondary text-base-100 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300 z-50 fixed bottom-4 right-4 p-3" @click="displayStore.showTutorial = !displayStore.showTutorial">
    {{ displayStore.showTutorial ? 'Launch' : 'Show Instructions' }}
  </button>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
const mainHeight = computed(() => displayStore.mainHeight)
const isFlippedComplete = ref(false)

const handleTransitionEnd = () => {
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
.fade-enter,
.fade-leave-to /* .fade-leave-active in <2.1.8 */ {
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
