<!-- /components/content/art/art-card.vue -->
<template>
  <div
    class="relative w-full flex flex-col bg-primary bg-opacity-30 border border-accent rounded-2xl overflow-hidden transition-all"
  >
    <!-- Prompt (optional title display) -->
    <h3
      class="text-xs sm:text-sm font-semibold px-2 pt-2 truncate"
      v-if="art.promptString"
      :title="art.promptString"
    >
      {{ art.promptString }}
    </h3>

    <!-- Delete Button -->
    <div class="absolute top-2 right-2 z-20">
      <button
        v-if="canDelete"
        class="bg-error text-white p-1 rounded-full hover:bg-error-content transition-all"
        title="Delete Image"
        @click.stop="confirmDelete"
      >
        <Icon name="kind-icon:delete" class="w-4 h-4" />
      </button>
    </div>

    <!-- Confirm Delete Modal -->
    <div
      v-if="confirmingDelete"
      class="absolute top-2 right-2 bg-base-100 border border-warning rounded-lg shadow-lg p-2 w-40 sm:w-48 z-30"
      @click.stop
    >
      <p class="text-xs mb-2 text-warning">Confirm delete?</p>
      <div class="flex gap-2">
        <button
          class="bg-error text-white rounded-md px-3 py-1 hover:bg-error-content"
          @click.stop="deleteImage"
        >
          Yes
        </button>
        <button
          class="bg-base-200 text-gray-700 rounded-md px-3 py-1 hover:bg-base-300"
          @click.stop="cancelDelete"
        >
          No
        </button>
      </div>
    </div>

    <!-- Image Display -->
<!-- Image Display -->
<div
  class="relative w-full aspect-square flex items-center justify-center overflow-hidden cursor-pointer"
  @click="toggleDetails"
>

      <template v-if="loadingImage">
        <div
          class="animate-pulse flex items-center justify-center w-full h-full"
        >
          <Icon
            name="kind-icon:loading"
            class="w-10 h-10 text-info animate-spin"
          />
        </div>
      </template>
      <template v-else>
        <img
          :src="computedArtImage"
          alt="Artwork"
          class="w-full h-full object-cover transition-transform hover:scale-105"
          loading="lazy"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'

const props = defineProps<{
  art: Art
  artImage?: ArtImage
}>()

const artStore = useArtStore()
const userStore = useUserStore()

const confirmingDelete = ref(false)
const localArtImage = ref<ArtImage | null>(null)
const loadingImage = ref(false)

const confirmDelete = () => (confirmingDelete.value = true)
const cancelDelete = () => (confirmingDelete.value = false)
const toggleDetails = () => {
  artStore.currentArt = props.art
  artStore.currentArtImage =
    localArtImage.value || props.artImage || null
  
}

const canDelete = computed(
  () => props.art.userId === userStore.userId || userStore.isAdmin,
)

const computedArtImage = computed(() => {
  if (localArtImage.value?.imageData) {
    return `data:image/${localArtImage.value.fileType};base64,${localArtImage.value.imageData}`
  }
  if (props.artImage?.imageData) {
    return `data:image/${props.artImage.fileType};base64,${props.artImage.imageData}`
  }
  if (!props.art.artImageId && props.art?.path) {
    return props.art.path
  }
  return '/images/backtree.webp'
})

const fetchArtImage = async () => {
  if (!props.art.artImageId) return
  loadingImage.value = true
  const fetched = await artStore.getOrFetchArtImageById(props.art.artImageId)
  if (fetched?.imageData) localArtImage.value = fetched
  loadingImage.value = false
}

const deleteImage = async () => {
  try {
    if (props.art.artImageId) {
      await artStore.deleteArtImage(props.art.artImageId)
    }
    await artStore.deleteArt(props.art.id)
    confirmingDelete.value = false
    alert('Deleted!')
  } catch (error) {
    console.error('Delete failed:', error)
    confirmingDelete.value = false
    alert('Delete failed.')
  }
}

onMounted(() => {
  if (props.art.artImageId && !props.artImage?.imageData) {
    fetchArtImage()
  } else if (props.artImage?.imageData) {
    localArtImage.value = props.artImage
    loadingImage.value = false
  }
})

watch(
  () => props.art.artImageId,
  async (newId) => {
    if (newId && !props.artImage?.imageData) {
      await fetchArtImage()
    }
  },
  { immediate: true },
)
</script>
