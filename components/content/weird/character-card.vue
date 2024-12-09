<template>
  <div
    :class="[
      'relative flex flex-col bg-base-200 border rounded-2xl p-4 m-2 hover:shadow-lg transition-all cursor-pointer',
      isSelected ? 'border-primary bg-primary/10' : 'border-gray-400',
    ]"
    @click="selectCharacter"
  >
    <!-- Delete Button -->
    <div class="absolute top-2 right-2 z-20">
      <button
        v-if="canDelete"
        class="bg-error text-white p-2 rounded-full hover:bg-error-content transition-all"
        title="Delete Character"
        @click.stop="deleteCharacter"
      >
        <Icon name="mdi:delete-outline" class="w-4 h-4" />
      </button>
    </div>

    <!-- Character Image -->
    <div
      class="relative flex justify-center items-center overflow-hidden rounded-lg"
    >
      <img
        :src="computedCharacterImage"
        alt="Character Portrait"
        class="rounded-2xl transition-transform hover:scale-105 w-full h-40 object-cover"
        loading="lazy"
        @click.stop="toggleDetails"
      />
    </div>

    <!-- Name and Summary -->
    <div class="flex flex-col mt-4 mb-4">
      <h2 class="text-xl font-bold text-gray-800 truncate">
        {{ displayName }}
      </h2>
      <p class="text-sm text-gray-600">Class: {{ character.class || 'Unknown' }}</p>
      <p class="text-sm text-gray-600">Species: {{ character.species || 'Unknown' }}</p>
      <p class="text-sm text-gray-600">Genre: {{ character.genre || 'Unknown' }}</p>
    </div>

    <!-- Stats Section -->
    <div class="grid grid-cols-3 gap-2 bg-base-300 rounded-lg shadow-inner p-2">
      <div
        v-for="i in statKeys"
        :key="'stat-' + i"
        class="flex flex-col items-center bg-base-200 border border-gray-500 rounded-md p-2"
      >
        <span class="text-xs font-bold uppercase text-gray-700">
          {{ character[`statName${i}`] || `Stat ${i}` }}
        </span>
        <span class="text-lg font-bold text-gray-800">
          {{ character[`statValue${i}`] || 0 }}
        </span>
      </div>
    </div>

    <!-- Buttons and Details -->
    <div v-if="isSelected" class="mt-4 space-y-4">
is selected!
      <div class="flex justify-between items-center">
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

      <!-- Details Panel -->
      <div
        
        class="absolute top-0 right-0 h-full w-2/3 bg-base-100 border-l border-accent p-4 rounded-r-2xl overflow-y-auto z-30"
      >
        <h4 class="text-lg font-bold mb-2">Character Details</h4>
        <p><strong>Backstory:</strong> {{ character.backstory || 'None' }}</p>
        <p><strong>Quirks:</strong> {{ character.quirks || 'None' }}</p>
        <p><strong>Skills:</strong> {{ character.skills || 'None' }}</p>
        <p><strong>Inventory:</strong> {{ character.inventory || 'None' }}</p>
      </div>
    </div>
  </div>
</template>

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

const canDelete = computed(
  () => userStore.isAdmin || userStore.userId === character.userId,
)
const isSelected = computed(
  () => characterStore.selectedCharacter?.id === character.id,
)
const statKeys = [1, 2, 3, 4, 5, 6]

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
  return '/images/default-character.jpg'
})

// Methods
const selectCharacter = () => characterStore.selectCharacter(character)
const deleteCharacter = () => characterStore.deleteCharacter(character.id)

const chat = () => alert('Chat feature coming soon!')
const adventure = () => alert('Adventure feature coming soon!')

// On Mounted
onMounted(async () => {
  if (character.artImageId) {
    artImage.value = await artStore.getArtImageById(character.artImageId)
  }
})
</script>
