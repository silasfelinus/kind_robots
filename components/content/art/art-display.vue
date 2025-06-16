<template>
  <div
    v-if="art"
    class="fixed inset-0 z-50 bg-base-200 bg-opacity-90 flex items-center justify-center p-[5vh] sm:p-[5vw]"
    @click.self="closeDisplay"
  >
    <div
      class="relative w-full h-full max-w-[90vw] max-h-[90vh] overflow-hidden rounded-xl shadow-xl bg-base-100 border border-accent"
    >
      <div class="w-full h-full flex flex-col" :class="expanded ? 'lg:flex-row' : ''">
        <!-- Art Image -->
        <div
          class="flex-1 flex items-center justify-center cursor-pointer"
          @click="toggleExpanded"
        >
          <img
            :src="computedArtImage"
            alt="Artwork"
            class="object-contain max-h-full max-w-full"
          />
        </div>

        <!-- Expanded Details Panel -->
        <div
          v-if="expanded"
          class="w-full lg:max-w-sm flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-base-300 p-4 space-y-6 overflow-y-auto"
        >
          <art-info :art="art" :artImage="localArtImage" />
          <art-control :art="art" @close="closeDisplay" />
        </div>

        <!-- Collapsed Footer Panel -->
        <div
          v-else
          class="absolute bottom-0 w-full bg-base-100 bg-opacity-95 border-t border-base-300 p-4 max-h-[40%] overflow-y-auto"
        >
          <art-info :art="art" :artImage="localArtImage" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/art/art-display.vue
import { computed, onMounted, ref, watch } from 'vue'
import { useArtStore } from '@/stores/artStore'

const artStore = useArtStore()
const art = computed(() => artStore.currentArt)
const localArtImage = ref<ArtImage | null>(null)
const loadingImage = ref(false)
const expanded = ref(false)

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
  console.log('🛑 Closing art-display')
  artStore.currentArt = null
}

const toggleExpanded = () => {
  expanded.value = !expanded.value
}

onMounted(() => {
  if (art.value?.artImageId) fetchArtImage()
})

watch(
  () => art.value,
  (newVal) => {
    if (newVal) {
      console.log('🎨 Displaying art-detail for:', newVal.title || newVal.id)
    }
  },
  { immediate: true }
)
</script>
