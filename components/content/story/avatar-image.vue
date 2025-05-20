<!-- /components/content/story/avatar-image.vue -->

<template>
  <div v-if="hydrated" class="relative w-full h-full border-2 border-black">
    <!-- Optional Top Icon -->
    <div class="absolute top-1 left-1 z-10">
      <Icon
        name="kind-icon:minimize"
        class="text-primary w-4 h-4 hover:opacity-80 cursor-pointer transition"
        @click="handleAvatarClick"
      />
    </div>

    <div class="flip-card h-full w-full" @click="handleAvatarClick">
      <div class="flip-card-inner" :class="{ 'is-flipped': flipped }">
        <div class="flip-card-front">
          <img
            :src="safeImage"
            alt="Avatar"
            class="avatar-img shadow-lg hover:shadow-xl rounded-2xl object-cover w-full h-full"
          />
        </div>
        <div class="flip-card-back">
          <img
            :src="safeBackImage"
            alt="New Avatar"
            class="avatar-img shadow-lg hover:shadow-xl rounded-2xl object-cover w-full h-full"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { usePageStore } from '@/stores/pageStore'
import { useBotStore } from '@/stores/botStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { useDisplayStore } from '@/stores/displayStore'

const flipped = ref(false)
const hydrated = ref(false)

const displayStore = useDisplayStore()
const botStore = useBotStore()
const errorStore = useErrorStore()
const pageStore = usePageStore()

const currentBot = computed(() => botStore.currentBot)
const pageImage = computed(() => pageStore.image)

const fallbackImage = '/images/botcafe.webp'

const resolveImage = (src?: string | null): string => {
  if (typeof src !== 'string' || !src.length) return fallbackImage
  return src.startsWith('/') ? src : `/images/${src}`
}

const safeImage = computed(() => {
  return resolveImage(
    pageImage.value?.length ? pageImage.value : currentBot.value?.avatarImage,
  )
})

const safeBackImage = computed(() => {
  return resolveImage(currentBot.value?.avatarImage || safeImage.value)
})

onMounted(() => {
  hydrated.value = true
})

watch(currentBot, (newBot, oldBot) => {
  if (newBot && newBot !== oldBot) {
    flipped.value = !flipped.value
  }
})

const handleAvatarClick = () => {
  try {
    flipped.value = !flipped.value
    displayStore.toggleBigMode()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to toggle sidebar'
    errorStore.setError(ErrorType.INTERACTION_ERROR, message)
  }
}
</script>

<style scoped>
.flip-card {
  width: 100%;
  height: 100%;
  perspective: 1000px;
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
  border-radius: 1rem;
  overflow: hidden;
}

.flip-card-back {
  transform: rotateY(180deg);
}
</style>
