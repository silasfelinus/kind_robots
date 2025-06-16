// /components/content/art/art-display.vue
<template>
  <div
    v-if="art"
    class="fixed inset-0 z-50 bg-base-200 bg-opacity-90 flex items-center justify-center"
    @click.self="closeDisplay"
  >
    <div
      class="relative max-w-[95vw] max-h-[95vh] w-full h-full flex flex-col lg:flex-row overflow-hidden rounded-xl shadow-xl"
    >
      <!-- Art Image Section -->
      <div class="flex-1 bg-base-100 flex items-center justify-center p-4">
        <img
          :src="computedArtImage"
          alt="Artwork"
          class="max-h-full max-w-full object-contain rounded-lg"
        />
      </div>

      <!-- Info and Controls -->
      <div
        class="w-full lg:w-[24rem] bg-base-100 border-l border-base-300 p-4 space-y-6 overflow-y-auto"
      >
        <art-info :art="art" :artImage="localArtImage" />
        <art-control :art="art" @close="closeDisplay" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useArtStore } from '@/stores/artStore'

const artStore = useArtStore()
const art = computed(() => artStore.currentArt)
const localArtImage = ref<ArtImage | null>(null)
const loadingImage = ref(false)

const computedArtImage = computed(() => {
  if (localArtImage.value?.imageData) {
    return `data:image/${localArtImage.value.fileType};base64,${localArtImage.value.imageData}`
  }
  if (art.value?.path) return art.value.path
  return '/images/backtree.webp'
})

const fetchArtImage = async () => {
  if (!art.value?.artImageId) return
  loadingImage.value = true
  const fetched = await artStore.getOrFetchArtImageById(art.value.artImageId)
  if (fetched?.imageData) localArtImage.value = fetched
  loadingImage.value = false
}

const closeDisplay = () => {
  artStore.currentArt = null
}

onMounted(() => {
  if (art.value?.artImageId) fetchArtImage()
})

watch(
  () => art.value?.artImageId,
  async (newId) => {
    if (newId) await fetchArtImage()
  },
  { immediate: true },
)
</script>

<style scoped>
/* Optional blur or darken background */
</style>
