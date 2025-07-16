<!-- /components/content/story/mode-nav.vue -->
<template>
  <div
    v-if="modeInfo"
    class="flex w-full h-full items-center justify-center gap-4 px-4"
  >
    <!-- Add Button -->
    <div
      @click="handleAddMode"
      class="flex-1 flex flex-col items-center justify-center gap-2 p-6 bg-base-200 hover:bg-primary hover:text-white rounded-2xl border border-base-300 shadow-md cursor-pointer transition-all duration-200"
    >
      <Icon :name="modeInfo.icon" class="w-12 h-12 md:w-16 md:h-16" />
      <div class="text-lg font-semibold text-center">
        Create a new {{ modeInfo.label }}
      </div>
    </div>

    <!-- Gallery Button -->
    <div
      @click="handleGalleryMode"
      class="flex-1 flex flex-col items-center justify-center gap-2 p-6 bg-base-200 hover:bg-accent hover:text-white rounded-2xl border border-base-300 shadow-md cursor-pointer transition-all duration-200"
    >
      <Icon :name="modeInfo.icon" class="w-12 h-12 md:w-16 md:h-16" />
      <div class="text-lg font-semibold text-center">
        Explore {{ modeInfo.label }} Gallery
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/story/mode-nav.vue
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { modes } from '@/stores/seeds/modeLinks'

const router = useRouter()
const displayStore = useDisplayStore()

const modeInfo = computed(
  () => modes.find((m) => m.name === displayStore.displayMode) ?? null,
)

function handleAddMode() {
  if (!modeInfo.value) return
  displayStore.setAction('add')
  router.push(modeInfo.value.addRoute)
}

function handleGalleryMode() {
  if (!modeInfo.value) return
  displayStore.setAction('gallery')
  router.push(modeInfo.value.galleryRoute)
}
</script>
