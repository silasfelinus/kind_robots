<template>
  <div
    class="bg-primary bg-opacity-30 border border-accent rounded-2xl p-2 m-2 transition-all duration-300 ease-in-out hover:shadow-lg cursor-pointer flex flex-col justify-between h-full"
    @click="selectArt"
  >
    <!-- Art Information -->
    <h3 class="text-lg font-semibold mb-2 truncate text-center" title="Prompt">
      {{ art?.promptString || 'No prompt available' }}
    </h3>

    <!-- Image Section -->
    <div
      class="relative flex-grow flex justify-center items-center overflow-hidden"
      :class="fullscreenMode ? 'h-screen' : 'max-h-[50vh]'"
    >
      <!-- Display artImage.imageData (base64) or art.path -->
      <img
        :src="computedArtImage"
        alt="Artwork"
        class="rounded-2xl transition-transform ease-in-out hover:scale-105 w-full object-cover cursor-pointer"
        :class="
          fullscreenMode ? 'h-auto w-auto max-h-screen max-w-screen' : 'h-auto'
        "
        loading="lazy"
        @click.stop="toggleFullscreenMode"
      />
    </div>

    <!-- Display if showing art-image or art-path -->
    <div class="text-center mt-2">
      <span class="text-sm text-info">
        Displaying: {{ showArtImage ? 'Art Image (Base64)' : 'Art Path' }}
      </span>
    </div>

    <!-- Art Metadata -->
    <div class="mt-2 flex flex-col items-center">
      <p class="text-base truncate" title="Pitch">
        {{ art?.pitchId || 'No pitch available' }}
      </p>
      <div class="flex justify-between items-center w-full mt-2 px-4">
        <p class="text-base">Claps: {{ reactions.length || 0 }}</p>
        <p class="text-base">
          isPublic?:
          <span class="font-semibold">{{ art.isPublic ? 'Yes' : 'No' }}</span>
        </p>
      </div>
    </div>

    <!-- Toggle Button for Art Details -->
    <div class="mt-4 flex justify-center">
      <button
        class="bg-secondary text-white rounded-lg px-4 py-2"
        @click="toggleDetails"
      >
        {{ showDetails ? 'Hide' : 'Show' }} Details
      </button>
    </div>

    <!-- Art Details Toggle Section -->
    <div
      v-if="showDetails"
      class="mt-4 p-4 bg-base-200 overflow-y-auto rounded-xl"
    >
      <pre class="text-sm whitespace-pre-wrap">{{ props.art }}</pre>
      <!-- Show artImage details if available -->
      <pre v-if="hasImage" class="text-sm whitespace-pre-wrap">{{
        localArtImage
      }}</pre>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useReactionStore } from '@/stores/reactionStore'

const props = defineProps<{
  art: Art
  artImage?: ArtImage
}>()

// Local state to store fetched art image and track whether to show art image or path
const localArtImage = ref<ArtImage | null>(null)
const showArtImage = ref(false)
const fullscreenMode = ref(false)
const showDetails = ref(false)

// Check if we have an art image locally or via props
const hasImage = computed(
  () => !!(localArtImage.value || props.artImage?.imageData),
)

const artStore = useArtStore()
const reactionStore = useReactionStore()

// Reactions associated with the art
const reactions = computed(() =>
  reactionStore.reactions.filter((r) => r.artId === props.art.id),
)

// Computed property to decide whether to display art image or art path
const computedArtImage = computed(() => {
  if (localArtImage.value?.imageData) {
    // Return art image as base64 if available locally
    return `data:image/${localArtImage.value.fileType};base64,${localArtImage.value.imageData}`
  } else if (props.artImage?.imageData) {
    // Return art image from props if available
    return `data:image/${props.artImage.fileType};base64,${props.artImage.imageData}`
  } else if (props.art.path) {
    // Fallback to art path if no image is available
    return props.art.path
  }
  return '/images/backtree.webp' // Default image if nothing is available
})

// Fetch art image by artImageId on component mount
onMounted(() => {
  if (props.art.artImageId && !props.artImage?.imageData) {
    // If there's an artImageId but no image data, fetch from backend
    fetchArtImage()
  } else if (props.artImage?.imageData) {
    // If image data exists in props, use it directly
    localArtImage.value = props.artImage
    showArtImage.value = true
  }
})

const fetchArtImage = async () => {
  try {
    if (props.art.artImageId) {
      const artImage = await artStore.fetchArtImageById(props.art.artImageId)
      if (artImage) {
        console.log('Art image fetched:', artImage)
        localArtImage.value = artImage
        showArtImage.value = true
      } else {
        console.warn(`No art image found for artId ${props.art.artImageId}`)
      }
    } else {
      console.warn('No artImageId available to fetch.')
    }
  } catch (error) {
    console.error('Error fetching art image:', error)
  }
}

// Toggle fullscreen mode for the image
const toggleFullscreenMode = () => {
  fullscreenMode.value = !fullscreenMode.value
}

// Toggle detailed view section
const toggleDetails = () => {
  showDetails.value = !showDetails.value
}

// Select art when clicked
const selectArt = () => {
  artStore.selectArt(props.art.id)
}
</script>
