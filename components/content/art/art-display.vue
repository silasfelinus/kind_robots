<template>
  <div
    v-if="art"
    class="fixed inset-0 z-50 flex items-center justify-center p-[5vh] sm:p-[5vw] bg-black bg-opacity-70"
    @click.self="closeDisplay"
  >
    <div
      class="relative w-full h-full max-w-[90vw] max-h-[90vh] overflow-auto rounded-xl shadow-xl bg-base-100 border border-accent p-6 flex flex-col gap-6"
    >
      <!-- Close Button -->
      <div class="flex justify-end">
        <button class="btn btn-sm btn-error" @click="closeDisplay">
          ❌ Close
        </button>
      </div>

      <!-- Content Layout -->
      <div class="flex flex-col lg:flex-row gap-6 h-full">
        <!-- Art Image -->
        <div class="w-full lg:w-2/3 flex justify-center items-center">
          <img
            v-if="computedArtImage"
            :src="computedArtImage"
            class="max-w-full max-h-[60vh] rounded border border-base-content"
          />
        </div>

        <!-- Info + Controls -->
        <div class="w-full lg:w-1/3 flex flex-col gap-4">
          <art-info :art="art" />
          <art-control :art="art" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/art/art-display.vue
import { computed, watchEffect } from 'vue'
import { useArtStore } from '@/stores/artStore'
import artInfo from './art-info.vue'
import artControl from './art-control.vue'

const artStore = useArtStore()
const art = computed(() => artStore.currentArt)
const artImage = computed(() => artStore.currentArtImage)

const computedArtImage = computed(() => {
  if (artImage.value?.imageData) {
    return `data:image/${artImage.value.fileType};base64,${artImage.value.imageData}`
  }
  if (art.value?.path) return art.value.path
  return ''
})

const closeDisplay = () => {
  console.log('🛑 Closing art-display')
  artStore.currentArt = null
  artStore.currentArtImage = null
}

// 🔁 Re-fetch artImage if needed
watchEffect(async () => {
  if (
    art.value?.artImageId &&
    (!artImage.value || !artImage.value.imageData)
  ) {
    const fetched = await artStore.getOrFetchArtImageById(art.value.artImageId)
    if (fetched?.imageData) {
      artStore.currentArtImage = fetched
    }
  }
})
</script>
