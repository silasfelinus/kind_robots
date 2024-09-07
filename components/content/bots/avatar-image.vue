<template>
  <div class="flip-card" @click="handleAvatarClick">
    <div class="flip-card-inner" :class="{ 'is-flipped': flipped }">
      <div class="flip-card-front">
        <img :src="selectImage" alt="Avatar" class="avatar-img rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300" />
      </div>
      <div class="flip-card-back">
        <img
          :src="currentBot?.avatarImage || selectImage"
          alt="New Avatar"
          class="avatar-img rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBotStore } from './../../../stores/botStore'
import { useContentStore } from '@/stores/contentStore'

// Content and Bot stores
const contentStore = useContentStore()
const { page } = useContent()
const botStore = useBotStore()
const currentBot = computed(() => botStore.currentBot)

// Manage flipping state
const flipped = ref(false)
watch(currentBot, () => {
  flipped.value = !flipped.value
})

// Select the appropriate image
const selectImage = computed(() => {
  if (page.value?.title === 'Bot Cafe' && currentBot.value?.avatarImage) {
    return currentBot.value.avatarImage
  }

  if (page.value?.image) {
    return `/images/${page.value.image}`
  }

  return '/images/botcafe.webp'
})

// Handle avatar click to toggle the sidebar and flip the avatar
const handleAvatarClick = () => {
  flipped.value = !flipped.value
  contentStore.toggleSidebar()  // Toggling sidebar when avatar is clicked
}
</script>

<style scoped>
.flip-card {
  perspective: 1000px;
  width: 100%; /* Use 100% to fill the container or set to a responsive width */
  max-width: 100px; /* Maximum width can be set to limit size */
  aspect-ratio: 1; /* Maintains square aspect ratio */
  cursor: pointer; /* Add a pointer cursor to indicate it's clickable */
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s ease-in-out;
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
  border-radius: 1rem; /* Rounded corners */
}

.flip-card-back {
  transform: rotateY(180deg);
}

/* Add transition and shadow for hover effect */
.avatar-img {
  transition: all 0.3s ease-in-out;
}

.avatar-img:hover {
  transform: scale(1.05); /* Slightly scale the image when hovered */
}
</style>