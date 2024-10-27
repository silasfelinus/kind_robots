<template>
  <div
    class="bg-primary border border-accent rounded-2xl p-2 m-2 transition-all duration-300 ease-in-out hover:shadow-lg cursor-pointer flex flex-col justify-between h-full"
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
      <!-- Use artImage.imageData or art.path, fallback to placeholder -->
      <img
        :src="getArtImage()"
        alt="Artwork"
        class="rounded-2xl transition-transform ease-in-out hover:scale-105 w-full object-cover cursor-pointer"
        :class="
          fullscreenMode ? 'h-auto w-auto max-h-screen max-w-screen' : 'h-auto'
        "
        loading="lazy"
        @click.stop="toggleFullscreenMode"
      />
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

    <!-- Toggle Button for Art Image -->
    <div class="mt-4 flex justify-center">
      <label class="flex items-center">
        <input
          v-model="showArtImage"
          type="checkbox"
          class="mr-2"
          @change="toggleArtImage"
        />
        <span>Show Art Image</span>
      </label>
    </div>

    <!-- Art Details Toggle Section -->
    <div
      v-if="showDetails"
      class="mt-4 p-4 bg-base-200 overflow-y-auto rounded-xl"
    >
      <pre class="text-sm whitespace-pre-wrap">
        {{ artData }}
      </pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'
import { useReactionStore } from '@/stores/reactionStore'

// Props: art is required, artImage is optional
const props = defineProps<{
  art: Art
  artImage?: ArtImage
}>()

// Initialize stores
const artStore = useArtStore()
const promptStore = usePromptStore()
const reactionStore = useReactionStore()

// Local state for toggling art image, details visibility, and fullscreen mode
const showDetails = ref(false)
const showArtImage = ref(false) // Controls the toggle for showing art image
const fullscreenMode = ref(false) // Controls whether the image is in fullscreen mode

// Art data to display in the toggle box
const artData = computed(() => props.art)

// Filter reactions for the current art
const reactions = computed(() =>
  reactionStore.reactions.filter((r) => r.artId === props.art.id),
)

// Fetch prompt and reactions on mount
onMounted(() => {
  console.log('Art Data:', props.art)
  if (props.art.promptId) promptStore.fetchPromptById(props.art.promptId)
  reactionStore.fetchReactionsByArtId(props.art.id)
})

// Handle art selection
const selectArt = () => {
  artStore.selectArt(props.art.id)
}

// Function to toggle art image and fetch it if necessary
const toggleArtImage = async () => {
  if (showArtImage.value && !props.artImage) {
    // Fetch the art image if it's not already available and showArtImage is true
    await fetchArtImage()
  }
}

// Method to fetch art image if not already present
const fetchArtImage = async () => {
  try {
    console.log('Fetching art image for art ID:', props.art.id)
    await artStore.fetchArtImageById(props.art.id)
  } catch (error) {
    console.error('Error fetching art image:', error)
  }
}

// Function to toggle fullscreen mode for the image
const toggleFullscreenMode = () => {
  fullscreenMode.value = !fullscreenMode.value
}

// Get the image path, prioritize artImage.imageData if available and toggled
const getArtImage = () => {
  if (showArtImage.value && props.artImage && props.artImage.imageData) {
    console.log(
      'Using artImage.imageData for display:',
      props.artImage.imageData,
    )
    // Assuming the imageData is base64, construct the data URL
    return `data:image/png;base64,${props.artImage.imageData}`
  } else if (props.art.path) {
    console.log('Using art.path for display:', props.art.path)
    return props.art.path
  }
  // Fallback to a placeholder image
  return '/images/backtree.webp'
}
</script>

<style scoped>
/* Fullscreen image custom styles if needed */
.fullscreen-img {
  max-width: 100vw;
  max-height: 100vh;
  object-fit: contain;
}
</style>
