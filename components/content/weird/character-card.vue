<template>
  <div
    :class="[
      'relative flex flex-col bg-base-200 border rounded-2xl p-4 m-2 hover:shadow-lg transition-all cursor-pointer',
      isSelected ? 'border-primary bg-primary/10' : 'border-gray-400',
    ]"
  >
    <!-- Delete Button -->
    <button
      v-if="canDelete"
      class="absolute top-2 right-2 bg-error text-white p-2 rounded-full hover:bg-error-content transition-transform hover:scale-110 z-20"
      title="Delete Character"
      @click.stop="deleteCharacter"
    >
      <Icon name="mdi:delete-outline" class="w-4 h-4" />
    </button>

    <!-- Character Image -->
    <div
      class="relative flex justify-center items-center overflow-hidden rounded-lg"
    >
      <img
        :src="computedCharacterImage"
        alt="Character Portrait"
        class="rounded-2xl w-full h-40 object-cover transition-transform hover:scale-105"
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

    <!-- Stats Section -->
    <div
      class="grid grid-cols-3 gap-2 bg-base-300 rounded-lg shadow-inner p-3 mt-4"
    >
      <div
        v-for="i in statKeys"
        :key="'stat-' + i"
        class="flex flex-col items-center bg-base-200 border border-gray-300 rounded-md p-2 hover:shadow-md"
      >
        <span class="text-xs font-bold uppercase text-gray-700">
          {{ character[`statName${i}`] || `Stat ${i}` }}
        </span>
        <span class="text-lg font-extrabold text-gray-800">
          {{ character[`statValue${i}`] || 0 }}
        </span>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-between items-center mt-4">
      <button
        class="btn flex items-center space-x-2 transition-transform hover:scale-105"
        :class="{
          'btn-primary shadow-lg': selectedMode === 'chat',
          'btn-outline': selectedMode !== 'chat',
        }"
        @click.stop="toggleMode('chat')"
      >
        <Icon name="mdi:message-outline" class="w-5 h-5" />
        <span>Chat</span>
      </button>
      <button
        class="btn flex items-center space-x-2 transition-transform hover:scale-105"
        :class="{
          'btn-secondary shadow-lg': selectedMode === 'adventure',
          'btn-outline': selectedMode !== 'adventure',
        }"
        @click.stop="toggleMode('adventure')"
      >
        <Icon name="mdi:compass-outline" class="w-5 h-5" />
        <span>Adventure</span>
      </button>
    </div>

    <!-- Conditional Display for WeirdCard or WeirdChat -->
    <div class="mt-4">
      <WeirdCard
        v-if="selectedMode === 'adventure'"
        :character="character"
        class="mt-4"
      />
      <WeirdChat
        v-if="selectedMode === 'chat'"
        :character="character"
        class="mt-4"
      />
    </div>

    <!-- Toggle Raw Character Object -->
    <div class="mt-4">
      <button class="btn btn-accent w-full" @click="toggleRawDetails">
        {{
          showRawDetails
            ? 'Hide Raw Character Object'
            : 'Show Raw Character Object'
        }}
      </button>
      <pre
        v-if="showRawDetails"
        class="bg-base-100 rounded-lg p-2 mt-2 text-sm overflow-x-auto"
        >{{ character }}
      </pre>
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
const selectedMode = ref(null) // 'chat' or 'adventure'
const showRawDetails = ref(false) // Toggle raw character object display

// Computed properties
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
const toggleMode = (mode) => {
  selectedMode.value = selectedMode.value === mode ? null : mode
}
const toggleRawDetails = () => {
  showRawDetails.value = !showRawDetails.value
}
const deleteCharacter = () => characterStore.deleteCharacter(character.id)

// On Mounted
onMounted(async () => {
  if (character.artImageId) {
    artImage.value = await artStore.getArtImageById(character.artImageId)
  }
})
</script>
