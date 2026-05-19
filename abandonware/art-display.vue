<!-- /abandonware/art-display.vue -->
@ts-nocheck
<template>
  <div
    v-if="artImage"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-[5vh] sm:p-[5vw]"
    @click.self="closeDisplay"
  >
    <div
      class="relative flex h-full max-h-[90vh] w-full max-w-[90vw] flex-col gap-6 overflow-auto rounded-xl border border-accent bg-base-100 p-6 shadow-xl"
    >
      <div class="flex justify-end">
        <button
          class="btn btn-sm btn-error"
          type="button"
          @click="closeDisplay"
        >
          ❌ Close
        </button>
      </div>

      <div class="flex h-full flex-col gap-6 lg:flex-row">
        <div class="flex w-full items-center justify-center lg:w-2/3">
          <img
            v-if="computedArtImage"
            :src="computedArtImage"
            class="max-h-[60vh] max-w-full rounded border border-base-content"
            alt="Selected art image"
          />
        </div>

        <div class="flex w-full flex-col gap-4 lg:w-1/3">
          <art-info :art-image="artImage" />
          <art-control :art-image="artImage" @close="closeDisplay" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /abandonware/art-display.vue
import { computed } from 'vue'
import { useArtStore } from '@/stores/artStore'
import artInfo from './art-info.vue'
import artControl from './art-control.vue'

const artStore = useArtStore()

const artImage = computed(() => artStore.currentArtImage)

const computedArtImage = computed(() => {
  const image = artImage.value

  if (!image) return ''

  if (image.imageData) {
    return `data:image/${image.fileType || 'png'};base64,${image.imageData}`
  }

  return image.imagePath || image.path || ''
})

function closeDisplay() {
  console.log('🛑 Closing art-display')
  artStore.deselectArtImage()
}
</script>
