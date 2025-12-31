<!-- /components/content/story/avatar-image.vue -->
<template>
  <div v-if="hydrated" class="relative w-full h-full">


    <!-- Flip card: the whole image area toggles bigMode on click -->
    <div
      class="h-full w-full cursor-pointer [perspective:1000px]"
      @click="handleAvatarClick"
    >
      <div
        :class="[
          'relative h-full w-full transition-transform duration-700 ease-in-out',
          '[transform-style:preserve-3d]',
          flipped ? '[transform:rotateY(180deg)]' : ''
        ]"
      >
        <!-- Front -->
        <div
          class="absolute inset-0 overflow-hidden [backface-visibility:hidden]"
        >
          <img
            :src="safeImage"
            alt="Avatar"
            class="w-full h-full object-cover shadow-lg hover:shadow-xl"
            draggable="false"
          />
        </div>

        <!-- Back -->
        <div
          class="absolute inset-0 overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)]"
        >
          <img
            :src="safeBackImage"
            alt="New Avatar"
            class="w-full h-full object-cover shadow-lg hover:shadow-xl"
            draggable="false"
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

const safeImage = computed(() =>
  resolveImage(pageImage.value?.length ? pageImage.value : currentBot.value?.avatarImage),
)

const safeBackImage = computed(() =>
  resolveImage(currentBot.value?.avatarImage || safeImage.value),
)

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
      error instanceof Error ? error.message : 'Failed to toggle big mode'
    errorStore.setError(ErrorType.INTERACTION_ERROR, message)
  }
}
</script>
