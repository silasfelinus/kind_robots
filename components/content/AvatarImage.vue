<template>
  <div class="flip-card" :class="{ 'is-flipped': isFlipping }">
    <div class="flip-card-inner">
      <div class="flip-card-side" :style="{ backgroundImage: `url(${currentAvatarImage})` }"></div>
      <div class="flip-card-side" :style="{ backgroundImage: `url(${nextAvatarImage})` }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBotsStore } from '../../stores/bots'

const botsStore = useBotsStore()
const defaultImage = '/images/kindtitle.webp'

let currentAvatarImage = ref<string>(botsStore.getActiveBot.avatarImage || defaultImage)
let nextAvatarImage = ref<string>(defaultImage)
const isFlipping = ref<boolean>(false)

watch(
  () => botsStore.getActiveBot.avatarImage,
  (newAvatarImage) => {
    if (newAvatarImage && newAvatarImage !== currentAvatarImage.value) {
      nextAvatarImage.value = currentAvatarImage.value // Before flipping, set nextAvatarImage to currentAvatarImage
      flipCard()
    }
  }
)

function flipCard() {
  isFlipping.value = true
  setTimeout(() => {
    nextAvatarImage.value = botsStore.getActiveBot.avatarImage || defaultImage // Halfway through flip, set nextAvatarImage to new avatar image
  }, 100) // Adjust timing to be half of the total flip duration
  setTimeout(() => {
    currentAvatarImage.value = nextAvatarImage.value
    isFlipping.value = false
  }, 200) // Full flip duration
}
</script>
<style scoped>
.flip-card {
  perspective: 1000px;
}
.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.8s;
  transform-style: preserve-3d;
}
.flip-card.is-flipped .flip-card-inner {
  transform: rotateY(180deg);
}
.flip-card-side {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  border-radius: 10px;
}
.flip-card-side:first-child {
  transform: rotateY(180deg);
}
</style>
