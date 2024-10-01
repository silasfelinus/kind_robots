<template>
  <div
    class="art-viewer bg-primary rounded-2xl p-4 transition-shadow hover:shadow-lg cursor-pointer"
    @click="selectArt"
  >
    <h3 class="text-lg font-semibold mb-2 truncate" title="Prompt">
      {{ prompt?.prompt || 'No prompt available' }}
    </h3>
    <div class="image-wrapper relative overflow-hidden max-h-48">
      <!-- Handle both path and imageData -->
      <template v-if="artImageData">
        <img
          :src="artImageData"
          alt="Artwork"
          class="rounded-2xl transition-transform duration-300 ease-in-out hover:scale-105 w-full h-auto object-cover"
          loading="lazy"
        />
      </template>
      <template v-else>
        <img
          :src="art.path ?? 'default-image-path.jpg'"
          alt="Artwork"
          class="rounded-2xl transition-transform duration-300 ease-in-out hover:scale-105 w-full h-auto object-cover"
          loading="lazy"
        />
      </template>
    </div>
    <div class="art-details mt-2">
      <p class="text-base truncate" title="Pitch">
        {{ selectedPitch?.pitch || 'No pitch available' }}
      </p>
      <div class="flex justify-between items-center mt-2">
        <p class="text-base">Claps: {{ reactions.length || 0 }}</p>
        <p class="text-base">
          isPublic?:
          <span class="font-semibold">{{ art.isPublic ? 'Yes' : 'No' }}</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useArtStore } from './../../../stores/artStore'
import { usePromptStore, type Prompt } from './../../../stores/promptStore'
import { usePitchStore } from './../../../stores/pitchStore'
import { useReactionStore } from './../../../stores/reactionStore'
import { computed, onMounted } from 'vue'

// Define props with type Art
const props = defineProps<{
  art: Art
}>()

// Initialize stores
const artStore = useArtStore()
const promptStore = usePromptStore()
const pitchStore = usePitchStore()
const reactionStore = useReactionStore()

// Compute prompt based on art ID
const prompt = computed<Prompt | null>(() =>
  props.art.promptId ? promptStore.fetchedPrompts[props.art.promptId] : null,
)

// Use the selected pitch from the pitch store
const selectedPitch = computed(() => pitchStore.selectedPitch)

// Filter reactions for the current art
const reactions = computed(() =>
  reactionStore.reactions.filter(
    (r: { artId: number | null }) => r.artId === props.art.id,
  ),
)

// Handle selecting art
const selectArt = () => {
  artStore.selectArt(props.art.id)
}

// Compute the image source: either from art path or artImage.imageData
const artImageData = computed(() => {
  const artImages = artStore.getArtImagesById(props.art.id)
  if (artImages.length > 0 && artImages[0].imageData) {
    // Convert imageData to base64 if available
    return `data:image/jpeg;base64,${artImages[0].imageData}`
  }
  // Fallback to art path if available
  return props.art.path || null
})

// Fetch prompt and reactions on mount
onMounted(() => {
  if (props.art.promptId) promptStore.fetchPromptById(props.art.promptId)
  reactionStore.fetchReactionsByArtId(props.art.id)
})
</script>

<!-- No scoped style section, using Tailwind only -->
