<template>
  <div
    :class="[
      'relative flex flex-col bg-base-200 border rounded-2xl p-4 m-2 hover:shadow-lg transition-all cursor-pointer',
      isSelected ? 'border-primary bg-primary/10' : 'border-gray-400',
    ]"
    @click="selectCharacter(character.id)"
  >
    <!-- Character Image -->
    <div
      class="relative flex justify-center items-center overflow-hidden rounded-lg"
    >
      <img
        :src="computedCharacterImage"
        alt="Character Portrait"
        class="rounded-2xl w-full h-40 object-cover"
        loading="lazy"
      />
    </div>

    <!-- Name and Summary -->
    <div class="flex flex-col mt-4">
      <h2 class="text-xl font-bold text-gray-800 truncate">
        {{ displayName }}
      </h2>
      <p class="text-sm text-gray-600">
        Class: {{ character.class || 'Unknown' }}
      </p>
      <p class="text-sm text-gray-600">
        Species: {{ character.species || 'Unknown' }}
      </p>
      <p class="text-sm text-gray-600">
        Genre: {{ character.genre || 'Unknown' }}
      </p>
    </div>

    <!-- Buttons -->
    <div class="flex justify-between items-center mt-4">
      <button
        class="btn btn-primary flex items-center space-x-2"
        @click.stop="chat"
      >
        <Icon name="mdi:message-outline" class="w-5 h-5" />
        <span>Chat</span>
      </button>
      <button
        class="btn btn-secondary flex items-center space-x-2"
        @click.stop="adventure"
      >
        <Icon name="mdi:compass-outline" class="w-5 h-5" />
        <span>Adventure</span>
      </button>
    </div>

    <!-- Toggle Plain Character Details -->
    <div class="mt-4">
      <button
        class="btn btn-accent w-full"
        @click.stop="togglePlainDetails"
      >
        {{ showPlainDetails ? 'Hide Details' : 'Show Character Object' }}
      </button>
      <pre
        v-if="showPlainDetails"
        class="bg-base-100 rounded-lg p-2 mt-2 text-sm overflow-x-auto"
      >
{{ character }}
      </pre>
    </div>

    <!-- Toggle Full Details -->
    <div class="mt-4">
      <button
        class="btn btn-info w-full"
        @click.stop="toggleDetails"
      >
        {{ showDetails ? 'Hide Full Details' : 'Show Full Details' }}
      </button>
      <div v-if="showDetails" class="mt-4 bg-base-100 rounded-lg p-4">
        <h4 class="text-lg font-bold mb-2">Character Details</h4>
        <p class="text-sm text-gray-600"><strong>Backstory:</strong> {{ character.backstory || 'None' }}</p>
        <p class="text-sm text-gray-600"><strong>Quirks:</strong> {{ character.quirks || 'None' }}</p>
        <p class="text-sm text-gray-600"><strong>Skills:</strong> {{ character.skills || 'None' }}</p>
        <p class="text-sm text-gray-600"><strong>Inventory:</strong> {{ character.inventory || 'None' }}</p>
      </div>
    </div>
  </div>
</template>

---

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'

// Props
const { character } = defineProps({
  character: {
    type: Object,
    required: true,
  },
})

// Stores
const characterStore = useCharacterStore()
const userStore = useUserStore()
const artStore = useArtStore()

// State
const artImage = ref(null)
const showPlainDetails = ref(false)
const showDetails = ref(false)

const canDelete = computed(
  () => userStore.isAdmin || userStore.userId === character.userId,
)
const isSelected = computed(
  () => characterStore.selectedCharacter?.id === character.id,
)
const displayName = computed(() =>
  character.name
    ? `${character.name} ${character.honorific || ''}`.trim()
    : 'Unnamed Hero',
)
const computedCharacterImage = computed(() => {
  if (artImage.value) {
    return `data:image/${artImage.value.fileType};base64,${artImage.value.imageData}`
  }
  if (character.imagePath) {
    return character.imagePath
  }
  return '/images/bot.webp'
})

// Methods
const selectCharacter = () => characterStore.selectCharacter(character)
const deleteCharacter = () => characterStore.deleteCharacter(character.id)
const togglePlainDetails = () => (showPlainDetails.value = !showPlainDetails.value)
const toggleDetails = () => (showDetails.value = !showDetails.value)

const chat = () => alert('Chat feature coming soon!')
const adventure = () => alert('Adventure feature coming soon!')

// On Mounted
onMounted(async () => {
  if (character.artImageId) {
    artImage.value = await artStore.getArtImageById(character.artImageId)
  }
})
</script>
