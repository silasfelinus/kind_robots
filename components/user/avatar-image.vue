<!-- /components/content/story/avatar-image.vue -->
<template>
  <div v-if="hydrated" class="relative w-full h-full">
    <div class="flip-card h-full w-full" @click.stop="handleAvatarClick">
      <div class="flip-card-inner" :class="{ 'is-flipped': flipped }">
        <div class="flip-card-front">
          <img
            v-if="resolvedImage"
            :src="resolvedImage"
            alt="Avatar"
            class="w-full h-full object-cover shadow-lg hover:shadow-xl"
            draggable="false"
          />
          <div
            v-else
            class="w-full h-full flex items-center justify-center bg-base-300"
          >
            <Icon name="kind-icon:person" class="w-full h-full text-accent" />
          </div>
        </div>
        <div class="flip-card-back">
          <img
            v-if="resolvedImage"
            :src="resolvedImage"
            alt="Avatar (back)"
            class="w-full h-full object-cover shadow-lg hover:shadow-xl"
            draggable="false"
          />
          <div
            v-else
            class="w-full h-full flex items-center justify-center bg-base-300"
          >
            <Icon name="kind-icon:person" class="w-full h-full text-accent" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'

const flipped = ref(false)
const hydrated = ref(false)
const resolvedImage = ref<string | null>(null)

const userStore = useUserStore()
const artStore = useArtStore()
const errorStore = useErrorStore()

watchEffect(async () => {
  const user = userStore.user

  if (user?.artImageId) {
    try {
      console.log(userStore.user?.avatarImage, userStore.user?.artImageId)
      const artImage = await artStore.getArtImageById(user.artImageId)
      resolvedImage.value = artImage?.imageData || user.avatarImage || null
    } catch (error) {
      console.error('Failed to fetch art image:', error)
      resolvedImage.value = user.avatarImage || null
    }
  } else {
    resolvedImage.value = user?.avatarImage || null
  }
})

onMounted(() => {
  hydrated.value = true
})

const handleAvatarClick = () => {
  try {
    flipped.value = !flipped.value
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to toggle'
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
