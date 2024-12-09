<template>
  <div
    :class="[
      'bg-base-200 border border-gray-400 rounded-lg shadow-md p-4 flex flex-col cursor-pointer',
      isSelected ? 'w-full h-auto' : 'w-64',
    ]"
    @click="selectCharacter"
  >
    <!-- Delete Icon -->
    <div class="relative">
      <button
        v-if="canDelete"
        class="absolute top-1 right-1 text-error"
        @click.stop="deleteCharacter"
      >
        <Icon name="kind-icon:delete" class="w-5 h-5" />
      </button>
    </div>

    <!-- Character Image -->
    <div class="w-full h-32 bg-gray-800 rounded-lg mb-4 overflow-hidden">
      <img
        v-if="artImage"
        :src="artImage"
        alt="Character Portrait"
        class="object-cover w-full h-60 rounded-lg"
      />
      <img
        v-else
        src="/images/bot.webp"
        alt="Default Portrait"
        class="object-cover w-full h-60 rounded-lg"
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
            <p class="text-sm text-gray-600">Personality: {{ character.personality }}</p>
      <p class="text-sm text-gray-500">User: {{ displayUsername }}</p>
    </div>

    <!-- Stats -->
    <div
      class="flex flex-row justify-between items-center bg-base-300 rounded-lg shadow-inner p-2"
    >
      <div
        v-for="i in statKeys"
        :key="'stat-' + i"
        class="flex flex-col items-center w-[16%] bg-base-200 border border-gray-500 rounded-md p-1"
      >
        <span class="text-xs font-bold uppercase text-gray-700">
          {{ character[`statName${i}`] || `Stat ${i}` }}
        </span>
        <span class="text-lg font-bold text-gray-800">
          {{ character[`statValue${i}`] || 0 }}
        </span>
      </div>
    </div>

    <!-- Additional Character Info -->
    <div v-if="isSelected" class="mt-4 text-sm text-gray-600 space-y-2">
      <p><strong>Class:</strong> {{ character.class || 'Unknown' }}</p>
      <p>
        <strong>Backstory:</strong>
        {{ character.backstory || 'Not shared yet.' }}
      </p>
      <p><strong>Quirks:</strong> {{ character.quirks || 'None provided.' }}</p>
      <p>
        <strong>Skills:</strong> {{ character.skills || 'No skills listed.' }}
      </p>
      <p><strong>Inventory:</strong> {{ character.inventory || 'Empty.' }}</p>

      <!-- Rewards -->
      <div>
        <strong>Rewards:</strong>
        <ul v-if="rewards.length" class="list-disc list-inside">
          <li v-for="reward in rewards" :key="reward.id">
            <strong>{{ reward.name }}</strong
            >: {{ reward.description }}
          </li>
        </ul>
        <p v-else>No rewards assigned yet.</p>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'
import { useCharacterStore } from '@/stores/characterStore'

// Props for the character card
const { character } = defineProps({
  character: {
    type: Object,
    required: true,
  },
})

// User store
const userStore = useUserStore()

// Character store
const characterStore = useCharacterStore()
const artStore = useArtStore()

// Reactive states
const displayUsername = ref(character.designer || null)
const artImage = ref(null)
const rewards = ref([]) // Store fetched rewards
const isSelected = computed(
  () => characterStore.selectedCharacter?.id === character.id,
)
const canDelete = computed(
  () => userStore.isAdmin || userStore.userId === character.userId,
)

// Display name in the format "character.name the character.honorific"
const displayName = computed(() =>
  character.name
    ? `${character.name} the ${character.honorific}`
    : 'Unnamed Hero',
)

// On mounted: fetch the username if not provided, the art image, and the rewards
onMounted(async () => {
  if (!character.designer && character.userId) {
    const username = userStore.getUsernameByUserId(character.userId)
    displayUsername.value = username || 'Unknown User'
  }

  if (character.artImageId) {
    artStore.getArtImageById(character.artImageId).then((image) => {
      if (image) {
        artImage.value = `data:image/${image.fileType};base64,${image.imageData}`
      }
    })
  } else if (character.imagePath) {
    artImage.value = character.imagePath
  }

  // Fetch rewards for the character
  if (character.id) {
    rewards.value = await characterStore.fetchCharacterRewards(character.id)
  }
})

// Handlers
const selectCharacter = () => {
  characterStore.selectCharacter(character)
}

const deleteCharacter = () => {
  characterStore.deleteCharacter(character.id)
}

// Dynamically get stat keys for rendering
const statKeys = [1, 2, 3, 4, 5, 6]
</script>
