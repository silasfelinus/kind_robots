<template>
  <div class="relative w-full h-full">
    <div class="flip-card w-full h-full" @click="handleAvatarClick">
      <div class="flip-card-inner" :class="{ 'is-flipped': flipped }">
        <div class="flip-card-front">
          <img
            :src="selectImage"
            alt="Avatar"
            class="avatar-img shadow-lg hover:shadow-xl rounded-2xl object-cover w-full h-full"
          />
        </div>
        <div class="flip-card-back">
          <img
            :src="currentBot?.avatarImage || selectImage"
            alt="New Avatar"
            class="avatar-img shadow-lg hover:shadow-xl rounded-2xl object-cover w-full h-full"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePageStore } from '@/stores/pageStore'
import { useBotStore } from '@/stores/botStore'
import { useErrorStore } from '@/stores/errorStore'
import { useDisplayStore } from '@/stores/displayStore'
import { ErrorType } from '@/stores/errorTypes' // Optional if using enums/constants

const flipped = ref(false)

const displayStore = useDisplayStore()
const botStore = useBotStore()
const errorStore = useErrorStore()
const pageStore = usePageStore()

const currentBot = computed(() => botStore.currentBot)
const pageImage = computed(() => pageStore.image)

// Priority: page.image > currentBot.avatarImage > default fallback
const selectImage = computed(() => {
  return pageImage.value || currentBot.value?.avatarImage || '/images/botcafe.webp'
})

const handleAvatarClick = () => {
  try {
    flipped.value = !flipped.value
    displayStore.toggleSidebar('sidebarLeftState')
    displayStore.toggleTutorial()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to toggle sidebar'
    errorStore.setError(ErrorType.INTERACTION_ERROR, message)
  }
}
</script>

<style scoped>
.flip-card {
  perspective: 1000px;
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
