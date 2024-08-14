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
import { useRoute } from 'vue-router'
import { useBotStore } from '@/stores/botStore'

const { page } = useContent()
const botStore = useBotStore()
const currentBot = computed(() => botStore.currentBot)
const route = useRoute()

// Manage flipping state
const flipped = ref(false)
watch(currentBot, () => {
  flipped.value = !flipped.value
})

const selectImage = computed(() => {
  if (route.path === '/botcafe' && currentBot.value) {
    return currentBot.value.avatarImage
  }

  // Check if page.image exists and is not null or undefined
  if (page.value && page.value.image) {
    return '/images/' + page.value.image
  }

  // Default image if nothing matches
  return '/images/botcafe.webp'
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
