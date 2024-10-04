<template>
  <div
    class="bg-primary border-1 border-accent overflow-y-auto rounded-2xl p-1 m-1 transition-all duration-300 ease-in-out hover:shadow-lg cursor-pointer"
    @click="selectArt"
  >
    <!-- Art Information -->
    <h3 class="text-lg font-semibold mb-2 truncate" title="Prompt">
      {{ art?.promptString || 'No prompt available' }}
    </h3>
    <div class="relative overflow-hidden max-h-[200px]">
      <!-- Use art.path or fallback to imageData from artImage or placeholder -->
      <img
        :src="art.path || getArtImage()"
        alt="Artwork"
        class="rounded-2xl transition-transform ease-in-out hover:scale-105 w-full h-auto object-cover"
        loading="lazy"
      />
    </div>
    <div class="mt-2">
      <p class="text-base truncate" title="Pitch">
        {{ art?.pitchId || 'No pitch available' }}
      </p>
      <div class="flex justify-between items-center mt-2">
        <p class="text-base">Claps: {{ reactions.length || 0 }}</p>
        <p class="text-base">
          isPublic?:
          <span class="font-semibold">{{ art.isPublic ? 'Yes' : 'No' }}</span>
        </p>
      </div>
    </div>

    <!-- Toggle Button for Detailed Info -->
    <div class="mt-4">
      <label class="flex items-center">
        <input v-model="showDetails" type="checkbox" class="mr-2" />
        <span>Show Art Details</span>
      </label>
    </div>

    <!-- Art Details Toggle Section -->
    <div v-if="showDetails" class="mt-4 p-4 bg-base-200 overflow-y-auto rounded-xl">
      <pre class="text-sm whitespace-pre-wrap">
        {{ artData }}
      </pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'
import { useReactionStore } from '@/stores/reactionStore'
import { computed, ref, onMounted } from 'vue'

// Props: art is required, artImage is optional
const props = defineProps<{
  art: Art
  artImage?: ArtImage
}>()

// Initialize stores
const artStore = useArtStore()
const promptStore = usePromptStore()
const reactionStore = useReactionStore()

// Local state for toggling details visibility
const showDetails = ref(false)

// Art data to display in the toggle box
const artData = computed(() => props.art)

// Filter reactions for the current art
const reactions = computed(() =>
  reactionStore.reactions.filter((r) => r.artId === props.art.id),
)

// Fetch prompt and reactions on mount
onMounted(() => {
  if (props.art.promptId) promptStore.fetchPromptById(props.art.promptId)
  reactionStore.fetchReactionsByArtId(props.art.id)
})

// Handle art selection
const selectArt = () => {
  artStore.selectArt(props.art.id)
}

// Get the image path, fallback to artImage.imageData if path is missing
const getArtImage = () => {
  if (props.artImage && props.artImage.imageData) {
    // Assuming the imageData is base64, construct the data URL
    return `data:image/png;base64,${props.artImage.imageData}`
  }
  return '/images/backtree.webp' // Fallback to a placeholder image
}
</script>
