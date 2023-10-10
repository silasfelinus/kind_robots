<template>
  <div class="flip-card" @click="flipped = !flipped">
    <div class="flip-card-inner" :class="{ 'is-flipped': flipped }">
      <div class="flip-card-front">
        <img :src="currentImage || defaultImage" alt="Avatar" class="avatar-img" />
      </div>
      <div class="flip-card-back">
        <img :src="currentBot?.avatarImage || defaultImage" alt="New Avatar" class="avatar-img" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watchEffect } from 'vue'
import { useBotStore } from '@/stores/botStore'

const botStore = useBotStore()
const currentBot = computed(() => botStore.currentBot)
const defaultImage = '/images/bot.webp'
const currentImage = ref(currentBot.value ? currentBot.value.avatarImage : defaultImage)
const flipped = ref(false)

watchEffect(() => {
  if (currentBot.value?.avatarImage !== currentImage.value) {
    flipped.value = !flipped.value
    nextTick(() => {
      currentImage.value = currentBot.value ? currentBot.value.avatarImage : defaultImage
    })
  }
})
</script>

<style scoped>
.flip-card {
  perspective: 1000px;
  width: 100px;
  height: 100px;
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
  border-radius: 50%;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.flip-card-back {
  transform: rotateY(180deg);
}
</style>
