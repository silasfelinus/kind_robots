<template>
  <div>
    <!-- Flip Card -->
    <div class="flip-card">
      <div class="flip-card-inner" :class="{ 'is-flipped': flipped }" @click="toggleFlip">
        <!-- Front: Expanded User Dashboard -->
        <div class="flip-card-front">
          <user-dashboard :is-expanded="true" />
          <smart-links class="mt-2" />
        </div>
        <!-- Back: Compact User Dashboard + Room Meta -->
        <div class="flip-card-back">
          <div class="flex flex-col">
            <new-dashboard :is-expanded="false" />
            <room-meta class="mt-2" />
          </div>
          <smart-links class="mt-2" />
        </div>
      </div>
    </div>
    <!-- Toggle Button -->
    <button class="mt-2" @click="toggleFlip">Toggle View</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const flipped = ref(false)

const toggleFlip = () => {
  flipped.value = !flipped.value
}
</script>

<style scoped>
.flip-card {
  perspective: 1000px;
  transform-style: preserve-3d;
}

.flip-card-inner {
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.flip-card-back {
  transform: rotateY(180deg);
}
</style>
