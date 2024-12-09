<template>
  <div
    :class="[
      'bg-base-200 border border-gray-400 rounded-lg shadow-md p-4 flex flex-col cursor-pointer relative',
      isSelected ? 'border-primary bg-primary/10 w-full h-auto' : 'w-64',
    ]"
    @click="selectCharacter"
  >
    <!-- Delete Icon -->
    <div class="absolute top-1 right-1">
      <button v-if="canDelete" class="text-error" @click.stop="deleteCharacter">
        <Icon name="kind-icon:delete" class="w-5 h-5" />
      </button>
    </div>

    <!-- Character Image -->
    <div class="w-full h-40 bg-gray-800 rounded-lg mb-4 overflow-hidden">
      <img
        v-if="artImage"
        :src="artImage"
        alt="Character Portrait"
        class="object-cover w-full h-full rounded-lg"
      />
      <img
        v-else
        src="/images/bot.webp"
        alt="Default Portrait"
        class="object-cover w-full h-full rounded-lg"
      />
    </div>

    <!-- Name and Class -->
    <div class="flex flex-col mb-4">
      <h2 class="text-xl font-bold text-gray-800 truncate">
        {{ displayName }}
      </h2>
      <p class="text-sm text-gray-600">Class: {{ character.class }}</p>
      <p class="text-sm text-gray-600">Species: {{ character.species }}</p>
      <p class="text-sm text-gray-600">Genre: {{ character.genre }}</p>
      <p class="text-sm text-gray-600">
        Personality: {{ character.personality }}
      </p>
      <p class="text-sm text-gray-500">User: {{ displayUsername }}</p>
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

    <!-- Buttons and JSON Display -->
    <div v-if="isSelected" class="mt-4 space-y-4">
      <div class="flex justify-between items-center">
        <button
          class="btn btn-primary flex items-center space-x-2"
          @click.stop="chat"
        >
          <Icon name="kind-icon:chat" class="w-5 h-5" />
          <span>Chat</span>
        </button>
        <button
          class="btn btn-secondary flex items-center space-x-2"
          @click.stop="adventure"
        >
          <Icon name="kind-icon:adventure" class="w-5 h-5" />
          <span>Adventure</span>
        </button>
      </div>

      <!-- Display JSON -->
      <div>
        <button class="btn btn-ghost btn-sm" @click.stop="toggleJson">
          {{ showJson ? 'Hide' : 'Show' }} JSON
        </button>
        <pre
          v-if="showJson"
          class="text-xs bg-gray-100 rounded p-2 overflow-auto"
        >
          {{ character }}
        </pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'
import { useCharacterStore } from '@/stores/characterStore'

// Props
const { character } = defineProps({
  character: {
    type: Object,
    required: true,
  },
})

// Stores
const userStore = useUserStore()
const characterStore = useCharacterStore()
const artStore = useArtStore()

// State
const displayUsername = ref(character.designer || null)
const artImage = ref(null)
const rewards = ref([])
const isSelected = computed(
  () => characterStore.selectedCharacter?.id === character.id,
)
const canDelete = computed(
  () => userStore.isAdmin || userStore.userId === character.userId,
)
const showJson = ref(false)

// Computed
const displayName = computed(() =>
  character.name
    ? `${character.name} the ${character.honorific}`
    : 'Unnamed Hero',
)
const statKeys = [1, 2, 3, 4, 5, 6]

// Methods
const selectCharacter = () => characterStore.selectCharacter(character)
const deleteCharacter = () => characterStore.deleteCharacter(character.id)
const toggleJson = () => (showJson.value = !showJson.value)

// Placeholder actions
const chat = () => alert('Chat feature coming soon!')
const adventure = () => alert('Adventure feature coming soon!')

// On Mounted
onMounted(async () => {
  if (!character.designer && character.userId) {
    const username = userStore.getUsernameByUserId(character.userId)
    displayUsername.value = username || 'Unknown User'
  }

  if (character.artImageId) {
    const image = await artStore.getArtImageById(character.artImageId)
    if (image) {
      artImage.value = `data:image/${image.fileType};base64,${image.imageData}`
    }
  } else if (character.imagePath) {
    artImage.value = character.imagePath
  }

  if (character.id) {
    rewards.value = await characterStore.fetchCharacterRewards(character.id)
  }
})
</script>
