<template>
  <div class="flip-card" @click="flipped = !flipped">
    <div class="flip-card-inner" :class="{ 'is-flipped': flipped }">
      <card-front key="front" class="flip-card-front" :bot="currentBot" />
      <card-back key="back" class="flip-card-back" :bot="currentBot" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBotStore } from '../../../stores/botStore'

const botsStore = useBotStore()
const currentBot = computed(() => botsStore.currentBot)
const flipped = ref(false)
</script>

<style scoped>
.flip-card {
  perspective: 1000px;
  width: 300px;
  height: 500px;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
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
  border: 2px solid var(--bg-base);
  border-radius: 5px;
}

.flip-card-back {
  transform: rotateY(180deg);
}
</style>
