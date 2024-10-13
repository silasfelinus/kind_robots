<template>
  <div class="flip-card" @click="handleAvatarClick">
    <div class="flip-card-inner" :class="{ 'is-flipped': flipped }">
      <div class="flip-card-front">
        <img
          :src="selectImage"
          alt="Avatar"
          class="avatar-img shadow-lg hover:shadow-xl transition-transform duration-300 transform hover:scale-105"
        />
      </div>
      <div class="flip-card-back">
        <img
          :src="currentBot?.avatarImage || selectImage"
          alt="New Avatar"
          class="avatar-img shadow-lg hover:shadow-xl transition-transform duration-300 transform hover:scale-105"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBotStore } from './../../../stores/botStore'
import { useLayoutStore } from './../../../stores/layoutStore'
import { useErrorStore } from './../../../stores/errorStore'
import { useDisplayStore } from './../../../stores/displayStore'

// Stores
const layoutStore = useLayoutStore()
const errorStore = useErrorStore()
const displayStore = useDisplayStore() // Add displayStore to handle the sidebar and tutorial toggles
const flipped = ref(false)

const { page } = useContent()

// Bot store
const botStore = useBotStore()
const currentBot = computed(() => botStore.currentBot)

// Watch for bot changes and flip the card if necessary
watch(currentBot, (newBot, oldBot) => {
  if (newBot && newBot !== oldBot) {
    flipped.value = !flipped.value
  }
})

const selectImage = computed(() => {
  if (page && (page as unknown as { image?: string }).image) {
    return (page as unknown as { image: string }).image
  }
  return currentBot.value?.avatarImage || '/images/botcafe.webp'
})

const handleAvatarClick = () => {
  try {
    // Flip the avatar image
    flipped.value = !flipped.value

    // Toggle the sidebar and tutorial using displayStore
    displayStore.toggleSidebar('sidebarLeftState')
    displayStore.toggleTutorial()

    // Optionally, if you still need to toggle other things in layoutStore
    layoutStore.toggleSidebar()
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to toggle sidebar'
    errorStore.setError(ErrorType.INTERACTION_ERROR, errorMessage)
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

.flip-card-back {
  transform: rotateY(180deg);
}
</style>
