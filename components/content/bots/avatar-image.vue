<template>
  <div class="flip-card" @click="handleAvatarClick">
    <div class="flip-card-inner" :class="{ 'is-flipped': flipped }">
      <div class="flip-card-front">
        <img
          :src="selectImage"
          alt="Avatar"
          class="avatar-img rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
        />
      </div>
      <div class="flip-card-back">
        <img
          :src="currentBot?.avatarImage || selectImage"
          alt="New Avatar"
          class="avatar-img rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBotStore } from './../../../stores/botStore'
import { useLayoutStore } from '@/stores/layoutStore'
import { useErrorStore } from '@/stores/errorStore'

// Content and Bot stores
const layoutStore = useLayoutStore()
const errorStore = useErrorStore()
const flipped = ref(false)

// Bot store
const botStore = useBotStore()
const currentBot = computed(() => botStore.currentBot)

// Watch for bot changes and flip the card if necessary
watch(currentBot, (newBot, oldBot) => {
  if (newBot && newBot !== oldBot) {
    flipped.value = !flipped.value
  }
})

// Select the appropriate image
const selectImage = computed(() => {
  return currentBot.value?.avatarImage || '/images/botcafe.webp'
})

const handleAvatarClick = () => {
  try {
    // Flip the avatar image
    flipped.value = !flipped.value

    // Toggle the sidebar state using layoutStore
    layoutStore.toggleSidebar()
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to toggle sidebar'
    errorStore.setError('INTERACTION_ERROR', errorMessage)
  }
}
</script>

<style scoped>
.flip-card {
  perspective: 1000px;
  width: 100%;
  max-width: 100px;
  aspect-ratio: 1;
  cursor: pointer;
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

:root {
  --rounded-size: 1rem;
  --shadow-hover: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.avatar-img {
  border-radius: var(--rounded-size);
  transition: all 0.3s ease-in-out;
}

.avatar-img:hover {
  box-shadow: var(--shadow-hover);
  transform: scale(1.05);
}

.flip-card-back {
  transform: rotateY(180deg);
}
</style>
