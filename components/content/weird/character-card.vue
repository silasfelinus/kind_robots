<template>
  <div
    class="relative flex flex-col bg-base-200 border border-gray-400 rounded-2xl p-4 m-2 hover:shadow-lg transition-all"
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
      class="relative flex justify-center items-center overflow-hidden rounded-lg cursor-pointer"
    >
      <img
        :src="computedCharacterImage"
        alt="Character Portrait"
        class="rounded-2xl transition-transform hover:scale-105 w-full h-40 object-cover"
        loading="lazy"
      />
    </div>

    <!-- Name and Summary -->
    <div class="flex flex-col mt-4 mb-4">
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

    <!-- Buttons -->
    <div class="mt-4 space-y-2">
      <button
        class="btn btn-primary flex items-center justify-center w-full"
        @click.stop="chat"
      >
        <Icon name="mdi:message-outline" class="w-5 h-5 mr-2" />
        Chat
      </button>
      <button
        class="btn btn-secondary flex items-center justify-center w-full"
        @click.stop="adventure"
      >
        <Icon name="mdi:compass-outline" class="w-5 h-5 mr-2" />
        Adventure
      </button>
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
const statKeys = [1, 2, 3, 4, 5, 6]

// Computed
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
