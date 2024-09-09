<template>
  <div
    class="art-viewer bg-primary rounded-2xl p-4 transition-shadow hover:shadow-lg cursor-pointer"
    @click="selectArt"
  >
    <h3 class="text-lg font-semibold mb-2 truncate" title="Prompt">
      {{ prompt?.prompt || 'No prompt available' }}
    </h3>
    <div class="image-wrapper relative">
      <img
        :src="art.path ?? 'default-image-path.jpg'"
        alt="Artwork"
        class="rounded-2xl transition-transform ease-in-out hover:scale-105 w-full h-auto object-cover"
        loading="lazy"
      />
    </div>
    <div class="art-details mt-2">
      <p class="text-base truncate" title="Pitch">
        {{ selectedPitch?.pitch || 'No pitch available' }}
      </p>
      <div class="flex justify-between items-center mt-2">
        <p class="text-base">Claps: {{ reactions.length || 0 }}</p>
        <p class="text-base">
          Adoptable?:
          <span class="font-semibold">{{ art.isPublic ? 'Yes' : 'No' }}</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useArtStore, type Art } from './../../../stores/artStore'
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
    (r: { artId: number }) => r.artId === props.art.id,
  ),
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
</script>

<style scoped>
.art-viewer {
  @apply transition-all ease-in-out duration-300;
}

.image-wrapper {
  @apply overflow-hidden;
  max-height: 200px;
}

.art-details {
  @apply mt-2;
}

.art-viewer:hover {
  @apply shadow-lg;
}

h3 {
  @apply truncate;
}
</style>
