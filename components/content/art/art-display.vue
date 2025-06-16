<!-- /components/content/art/art-display.vue -->
<template>
  <div
    class="fixed inset-0 z-50 bg-accent bg-opacity-90 text-base-content flex items-center justify-center p-[5vh] sm:p-[5vw]"
  >
    <!-- No art selected -->
    <div v-if="!art" class="text-2xl font-bold text-warning">
      ❌ No art selected
    </div>

    <!-- Art selected -->
    <div
      v-else
      class="relative w-full h-full max-w-[90vw] max-h-[90vh] overflow-auto rounded-xl shadow-xl bg-base-100 border border-accent p-6 flex flex-col gap-6 items-center justify-start"
    >
      <button class="btn btn-sm btn-error self-end" @click="closeDisplay">
        ❌ Close
      </button>

      <div class="text-left w-full space-y-2">
        <div class="text-2xl font-bold text-success">✅ Art found</div>
        <pre class="bg-base-200 p-4 rounded text-sm overflow-auto max-h-[40vh] whitespace-pre-wrap">
{{ JSON.stringify(art, null, 2) }}
        </pre>
        <img
          v-if="computedArtImage"
          :src="computedArtImage"
          class="max-w-full max-h-[40vh] rounded border border-base-content"
        />
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

const computedArtImage = computed(() => {
  if (localArtImage.value?.imageData) {
    return `data:image/${localArtImage.value.fileType};base64,${localArtImage.value.imageData}`
  }
  if (art.value?.path) return art.value.path
  return ''
})

const fetchArtImage = async () => {
  if (!art.value?.artImageId) return
  const fetched = await artStore.getOrFetchArtImageById(art.value.artImageId)
  if (fetched?.imageData) localArtImage.value = fetched
}

const closeDisplay = () => {
  console.log('🛑 Closing art-display')
  artStore.currentArt = null
}

onMounted(() => {
  if (art.value?.artImageId) fetchArtImage()
})

watch(
  () => art.value,
  async (newVal) => {
    if (newVal?.artImageId) await fetchArtImage()
    console.log(newVal ? `🎨 Showing art: ${newVal.title || newVal.id}` : '❌ No art selected')
  },
  { immediate: true }
)
</script>
