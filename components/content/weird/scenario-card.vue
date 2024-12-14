<template>
  <div
    :class="[
      'relative bg-base-200 border rounded-2xl p-4 m-2 hover:shadow-lg transition-all cursor-pointer',
      isSelected ? 'border-primary bg-primary/10' : 'border-gray-400',
      'flex flex-col sm:flex-row sm:items-start gap-4',
    ]"
  >
    <!-- Delete Button -->
    <button
      v-if="canDelete"
      class="absolute top-2 right-2 bg-error text-white p-2 rounded-full hover:bg-error-content transition-transform hover:scale-110 z-20"
      title="Delete Scenario"
      @click.stop="deleteScenario"
    >
      <Icon name="mdi:delete-outline" class="w-4 h-4" />
    </button>

    <!-- Scenario Image -->
    <div
      class="flex-shrink-0 relative flex justify-center items-center overflow-hidden rounded-lg sm:w-1/3"
    >
      <img
        :src="computedScenarioImage"
        alt="Scenario Image"
        class="rounded-2xl w-full h-40 object-cover transition-transform hover:scale-105"
        loading="lazy"
      />
    </div>

    <!-- Scenario Details -->
    <div class="flex flex-col sm:w-2/3">
      <!-- Title and Description -->
      <h2 class="text-xl font-bold text-gray-800 truncate">
        {{ scenario.title || 'Untitled Scenario' }}
      </h2>
      <p class="text-sm text-gray-600">
        {{ scenario.description || 'No description available.' }}
      </p>

      <!-- Genres and Locations -->
      <div class="flex flex-wrap mt-2 gap-2">
        <!-- Genres -->
        <span
          v-if="scenario.genres"
          class="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded-full"
        >
          {{ scenario.genres }}
        </span>

        <!-- Locations -->
        <a
          v-for="location in locationLinks"
          :key="location"
          href="#"
          class="text-xs text-accent underline hover:no-underline"
          @click.prevent="createChatRoom(location)"
        >
          {{ location }}
        </a>
      </div>

      <!-- Intros (Selectable Buttons) -->
      <div class="flex flex-wrap gap-2 mt-4">
        <button
          v-for="(intro, index) in introChoices"
          :key="index"
          class="btn btn-secondary btn-sm"
          @click="setCurrentChoice(intro)"
        >
          {{ intro }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'

// Props
defineProps({
  scenario: {
    type: Object,
    required: true,
  },
})

// Stores
const scenarioStore = useScenarioStore()
const userStore = useUserStore()
const artStore = useArtStore()

// State
const artImage = ref(null)

// Computed properties
const canDelete = computed(
  () => userStore.isAdmin || userStore.userId === scenario.userId,
)
const isSelected = computed(
  () => scenarioStore.selectedScenario?.id === scenario.id,
)
const computedScenarioImage = computed(() => {
  if (artImage.value) {
    return `data:image/${artImage.value.fileType};base64,${artImage.value.imageData}`
  }
  if (scenario.imagePath) {
    return scenario.imagePath
  }
  return '/images/scenarios/space.webp'
})

// Genres, Locations, and Intros
const locationLinks = computed(() => scenario.locations?.split(',') || [])
const introChoices = computed(() => {
  try {
    return JSON.parse(scenario.intros) || []
  } catch {
    return []
  }
})

// Methods
const deleteScenario = () => scenarioStore.deleteScenario(scenario.id)
const createChatRoom = (location) => {
  // Logic for creating a chat room at the given location
  scenarioStore.createChatRoom(location)
}
const setCurrentChoice = (choice) => {
  scenarioStore.currentChoice = choice
}

// On Mounted
onMounted(async () => {
  if (scenario.artImageId) {
    artImage.value = await artStore.getArtImageById(scenario.artImageId)
  }
})
</script>
