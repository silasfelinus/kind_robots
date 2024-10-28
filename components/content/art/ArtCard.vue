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
      <pre class="text-sm whitespace-pre-wrap">{{ artData }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'
import { useReactionStore } from '@/stores/reactionStore'

const props = defineProps<{
  art: Art
  artImage?: ArtImage
}>()

const localArtImage = ref<ArtImage | null>(null)

const artStore = useArtStore()
const promptStore = usePromptStore()
const reactionStore = useReactionStore()

const showDetails = ref(false)
const showArtImage = ref(false)
const fullscreenMode = ref(false)

const artData = computed(() => props.art)

const reactions = computed(() =>
  reactionStore.reactions.filter((r) => r.artId === props.art.id),
)

onMounted(() => {
  if (props.art.promptId) promptStore.fetchPromptById(props.art.promptId)
  reactionStore.fetchReactionsByArtId(props.art.id)
})

const selectArt = () => {
  artStore.selectArt(props.art.id)
}

const toggleArtImage = async () => {
  if (showArtImage.value && !localArtImage.value && !props.artImage) {
    await fetchArtImage()
  }
}

const fetchArtImage = async () => {
  try {
    const artImage = await artStore.fetchArtImageById(props.art.artImageId)
    if (artImage) {
      localArtImage.value = artImage
    }
  } catch (error) {
    console.error('Error fetching art image:', error)
  }
}

const toggleFullscreenMode = () => {
  fullscreenMode.value = !fullscreenMode.value
}

const toggleDetails = () => {
  showDetails.value = !showDetails.value
}

const getArtImage = () => {
  if (showArtImage.value && localArtImage.value?.imageData) {
    return `data:image/png;base64,${localArtImage.value.imageData}`
  } else if (props.artImage?.imageData) {
    return `data:image/png;base64,${props.artImage.imageData}`
  } else if (props.art.path) {
    return props.art.path
  }
  return '/images/backtree.webp'
}
</script>

<style scoped>
.fullscreen-img {
  max-width: 100vw;
  max-height: 100vh;
  object-fit: contain;
}
</style>
