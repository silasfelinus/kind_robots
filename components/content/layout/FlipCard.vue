<template>
  <div
    class="flip-card w-full border-accent border-2 rounded-2xl bg-base-300 relative shadow-lg"
    :style="{ height: mainHeight }"  <!-- Constrain height -->
    @click="flipped = !flipped"
  >
    <div class="flip-card-inner" :class="{ 'is-flipped': flipped }">
      <!-- Front side -->
      <div class="flip-card-front">
        <splash-tutorial />
      </div>

      <!-- Back side -->
      <div class="flip-card-back overflow-y-auto">
        <NuxtPage />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Initialize the display store
const displayStore = useDisplayStore()
const mainHeight = computed(() => `calc(var(--vh, 1vh) * ${displayStore.mainVh})`)
const flipped = ref(false)  // Track if the card is flipped
</script>

<style scoped>
.flip-card {
  perspective: 1000px; /* 3D perspective for the flip effect */
  width: 100%;
  height: 100%;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s; /* Smooth transition for the flip */
  transform-style: preserve-3d; /* 3D space for the flip */
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg); /* Flip the card */
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden; /* Hide the back of the card when not visible */
  -webkit-backface-visibility: hidden; /* Hide back on Webkit browsers */
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.flip-card-front {
  transform: rotateY(0deg); /* Default view */
}

.flip-card-back {
  transform: rotateY(180deg); /* Backside of the card */
  overflow-y: auto; /* Scrollable content if the back content exceeds height */
}
</style>
