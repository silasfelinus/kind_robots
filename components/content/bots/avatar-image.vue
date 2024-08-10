<template>
  <div
    class="flip-card"
    @click="flipped = !flipped"
  >
    <div
      class="flip-card-inner"
      :class="{ 'is-flipped': flipped }"
    >
      <div class="flip-card-front">
        <img
          :src="selectImage"
          alt="Avatar"
          class="avatar-img rounded-xl"
        >
      </div>
      <div class="flip-card-back">
        <img
          :src="currentBot?.avatarImage || selectImage"
          alt="New Avatar"
          class="avatar-img rounded-xl"
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useBotStore } from '@/stores/botStore'

const { page } = useContent()
const botStore = useBotStore()
const currentBot = computed(() => botStore.currentBot)
const route = useRoute()

const pageImage = computed(() => page.image)

// Default image
const defaultImage = computed(() => {
  return route.path === '/botcafe'
    ? currentBot.value
      ? currentBot.value.avatarImage
      : '/images/amibotsquare1.webp'
    : '/images/' + pageImage.value
})
const selectImage = computed(() => {
  if (route.path === '/botcafe' && currentBot.value) {
    return currentBot.value.avatarImage // Assuming bot is a reactive object containing the bot data
  }

  // Check if page.image exists and is not null or undefined
  if (page && page.image) {
    return '/images/' + page.image
  }

  // Default image if nothing matches
  return '/images/botcafe.webp'
})
// Manage flipping state
const flipped = ref(false)
watch(currentBot, () => {
  flipped.value = !flipped.value
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
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.flip-card-back {
  transform: rotateY(180deg);
}
</style>
