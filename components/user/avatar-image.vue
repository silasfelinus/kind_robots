<!-- /components/content/story/avatar-image.vue -->
<template>
  <div v-if="hydrated" class="relative w-full h-full">
    <div
      class="h-full w-full cursor-pointer perspective-[1000px]"
      @click="handleAvatarClick"
    >
      <div
        :class="[
          'relative h-full w-full transition-transform duration-700 ease-in-out transform-3d',
          flipped ? 'transform-[rotateY(180deg)]' : '',
        ]"
      >
        <div class="absolute inset-0 overflow-hidden backface-hidden">
          <img
            :src="avatarImage"
            alt="Avatar"
            class="w-full h-full object-cover shadow-lg hover:shadow-xl"
            draggable="false"
          />
        </div>

        <div class="absolute inset-0 overflow-hidden backface-hidden transform-[rotateY(180deg)]">
          <img
            :src="avatarImage"
            alt="Avatar"
            class="w-full h-full object-cover shadow-lg hover:shadow-xl"
            draggable="false"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'

const flipped = ref(false)
const hydrated = ref(false)

const userStore = useUserStore()
const displayStore = useDisplayStore()
const errorStore = useErrorStore()

const fallbackImage = '/images/botcafe.webp'

const avatarImage = computed(() => {
  const src = userStore.currentUser?.avatarImage
  if (typeof src !== 'string' || !src.length) return fallbackImage
  return src.startsWith('/') ? src : `/images/${src}`
})

onMounted(() => {
  hydrated.value = true
})

const handleAvatarClick = () => {
  try {
    flipped.value = !flipped.value
    displayStore.toggleBigMode()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to toggle big mode'
    errorStore.setError(ErrorType.INTERACTION_ERROR, message)
  }
}
</script>
