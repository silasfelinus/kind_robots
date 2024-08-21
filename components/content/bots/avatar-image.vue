<template>
  <div class="flip-card" @click="flipped = !flipped">
    <div class="flip-card-inner" :class="{ 'is-flipped': flipped }">
      <div class="flip-card-front">
        <img :src="selectImage" alt="Avatar" class="avatar-img rounded-xl" />
      </div>
      <div class="flip-card-back">
        <img
          :src="currentBot?.avatarImage || selectImage"
          alt="New Avatar"
          class="avatar-img rounded-xl"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBotStore } from './../../../stores/botStore'

const { page } = useContent()
const botStore = useBotStore()
const currentBot = computed(() => botStore.currentBot)

// Manage flipping state
const flipped = ref(false)
watch(currentBot, () => {
  flipped.value = !flipped.value
})

const selectImage = computed(() => {
  if (page.value?.title === 'Bot Cafe' && currentBot.value?.avatarImage) {
    return currentBot.value.avatarImage
  }

  if (page.value?.image) {
    return `/images/${page.value.image}`
  }

  return '/images/botcafe.webp'
})
</script>

<style scoped>
.flip-card {
  perspective: 1000px;
  width: 100%; /* Use 100% to fill the container or set to a responsive width */
  max-width: 100px; /* Maximum width can be set to limit size */
  aspect-ratio: 1; /* Maintains square aspect ratio */
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
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* Ensures image covers the area without distortion */
  object-position: center;
}

.flip-card-back {
  transform: rotateY(180deg);
}
</style>
