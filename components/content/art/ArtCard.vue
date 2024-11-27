<template>
  <div
    class="relative flex flex-col bg-primary bg-opacity-30 border border-accent rounded-2xl p-2 m-2 hover:shadow-lg transition-all"
  >
    <!-- Prompt at the top -->
    <h3 class="text-lg font-semibold truncate" title="Prompt">
      {{ art.promptString || 'No Prompt Available' }}
    </h3>

    <!-- Delete Button -->
    <div class="absolute top-2 right-2 z-20">
      <button
        v-if="canDelete"
        class="bg-error text-white p-2 rounded-full hover:bg-error-content transition-all"
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
      <p class="text-xs sm:text-sm mb-2 text-warning">Confirm delete?</p>
      <div class="flex gap-2">
        <button
          class="bg-error text-white rounded-md px-3 py-1 hover:bg-error-content transition-all"
          @click.stop="deleteImage"
        >
          Yes
        </button>
        <button
          class="bg-base-200 text-gray-700 rounded-md px-3 py-1 hover:bg-base-300 transition-all"
          @click.stop="cancelDelete"
        >
          No
        </button>
      </div>
    </div>

    <!-- Image Display -->
    <div
      class="relative flex justify-center items-center overflow-hidden cursor-pointer"
      @click="toggleDetails"
    >
      <img
        :src="computedArtImage"
        alt="Artwork"
        class="rounded-2xl transition-transform hover:scale-105 w-full h-auto object-cover"
        loading="lazy"
      />
    </div>

    <!-- Art Details Panel -->
    <div
      v-if="showDetails"
      class="absolute top-0 right-0 h-full w-1/2 md:w-2/3 bg-base-100 border-l border-accent p-4 rounded-r-2xl overflow-y-auto z-30"
    >
      <h4 class="text-lg font-bold mb-2">Art Details</h4>
      <pre class="text-sm whitespace-pre-wrap">{{ art }}</pre>
      <pre v-if="hasImage" class="text-sm whitespace-pre-wrap">
        {{ localArtImage }}
      </pre>

      <!-- Set as Avatar Button -->
      <button
        class="bg-accent text-white rounded-lg px-4 py-2 mt-4"
        @click="setAsAvatar"
      >
        Set as Avatar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'

const props = defineProps<{
  art: Art
  artImage?: ArtImage
}>()

const showDetails = ref(false)
const confirmingDelete = ref(false)
const localArtImage = ref<ArtImage | null | undefined>(null)

const hasImage = computed(
  () => !!(localArtImage.value || props.artImage?.imageData),
)

const artStore = useArtStore()
const userStore = useUserStore()

const canDelete = computed(() => {
  return props.art.userId === userStore.userId || userStore.isAdmin
})

const confirmDelete = () => {
  confirmingDelete.value = true
}

onMounted(() => {
  if (props.art.artImageId && !props.artImage?.imageData) {
    fetchArtImage()
  } else if (props.artImage?.imageData) {
    localArtImage.value = props.artImage
  }
})

const fetchArtImage = async () => {
  if (props.art.artImageId) {
    localArtImage.value = await artStore.getArtImageById(props.art.artImageId)
  }
}

const deleteImage = async () => {
  try {
    if (props.art.artImageId) {
      await artStore.deleteArtImage(props.art.artImageId)
    }
    await artStore.deleteArt(props.art.id)
    confirmingDelete.value = false
    alert('Art and its associated image have been deleted successfully!')
  } catch (error) {
    console.error('Error deleting art or art image:', error)
    confirmingDelete.value = false
    alert('Failed to delete the art or its associated image. Please try again.')
  }
}

const cancelDelete = () => {
  confirmingDelete.value = false
}

const toggleDetails = () => {
  showDetails.value = !showDetails.value
}

const setAsAvatar = async () => {
  try {
    await userStore.updateUserInfo({
      artImageId: props.art.artImageId,
    })
    await artStore.addArtToCollection({
      artId: props.art.id,
      label: 'avatars',
    })
    alert('Avatar updated successfully!')
  } catch (error) {
    console.error('Error setting avatar:', error)
  }
}

const computedArtImage = computed(() => {
  // Prioritize localArtImage if it exists
  if (localArtImage.value?.imageData) {
    return `data:image/${localArtImage.value.fileType};base64,${localArtImage.value.imageData}`
  }

  // Use props.artImage if no localArtImage is available
  if (props.artImage?.imageData) {
    return `data:image/${props.artImage.fileType};base64,${props.artImage.imageData}`
  }

  // Check art.path only if artImageId is missing
  if (!props.art.artImageId && props.art?.path) {
    return props.art.path
  }

  // Log fallback condition
  console.warn('Fallback to default image')
  return '/images/backtree.webp'
})
</script>
