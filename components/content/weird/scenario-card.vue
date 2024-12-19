<template>
  <div
    :class="[
      'relative bg-base-200 border rounded-2xl p-4 m-2 hover:shadow-lg transition-all cursor-pointer',
      isSelected ? 'border-primary bg-primary/10' : 'border-gray-400',
      'flex flex-col md:flex-row items-start gap-4',
    ]"
    @click="selectScenario"
  >
    <!-- Action Buttons -->
    <div
      v-if="isSelected"
      class="absolute top-2 right-2 flex items-center gap-3 z-20"
    >
      <!-- Delete Button -->
      <button
        v-if="canDelete"
        class="text-error p-3 rounded-full hover:bg-error-content transition-transform hover:scale-110"
        title="Delete Scenario"
        @click.stop="deleteScenario"
      >
        <Icon name="mdi:delete" class="w-5 h-5" />
      </button>
      <!-- Edit Button -->
      <button
        v-if="canDelete"
        class="text-primary p-3 rounded-full hover:bg-primary-content transition-transform hover:scale-110"
        title="Edit Scenario"
        @click.stop="editScenario"
      >
        <Icon name="mdi:pencil" class="w-5 h-5" />
      </button>
      <!-- Clone Button -->
      <button
        class="text-secondary p-3 rounded-full hover:bg-secondary-content transition-transform hover:scale-110"
        title="Clone Scenario"
        @click.stop="cloneScenario"
      >
        <Icon name="mdi:content-copy" class="w-5 h-5" />
      </button>
    </div>

    <!-- Scenario Image and Labels -->
    <div class="flex-shrink-0 relative flex flex-col items-center md:w-1/3">
      <!-- Image -->
      <img
        :src="computedScenarioImage"
        alt="Scenario Image"
        class="rounded-2xl object-cover transition-all duration-300"
        :class="{
          'h-40 w-40': !isSelected,
          'h-full w-full': isSelected,
        }"
        loading="lazy"
        style="aspect-ratio: 1 / 1"
      />
      <!-- Genres -->
      <p
        v-if="scenario.genres"
        class="mt-2 text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded-full text-center w-full truncate"
      >
        {{ scenario.genres }}
      </p>

      <!-- Inspirations -->
      <div
        v-if="scenario.inspirations"
        class="mt-2 px-3 py-2 bg-gray-100 rounded-md w-full text-left"
      >
        <span class="font-bold text-gray-700 block mb-1">Inspirations:</span>
        <p class="text-xs text-gray-500 whitespace-pre-wrap">
          {{ scenario.inspirations }}
        </p>
      </div>
    </div>

    <!-- Scenario Details -->
    <div class="flex flex-col md:w-2/3">
      <!-- Title -->
      <h2
        :class="[
          'text-xl font-bold text-gray-800 whitespace-normal leading-tight',
        ]"
      >
        {{ scenario.title || 'Untitled Scenario' }}
      </h2>

      <!-- Description -->
      <p
        :class="[
          'mt-2',
          isSelected ? 'text-lg text-gray-700' : 'text-sm text-gray-500',
        ]"
      >
        {{ scenario.description || 'No description available.' }}
      </p>

      <!-- Intros -->
      <div
        v-if="isSelected"
        class="flex flex-wrap gap-3 mt-4"
        :class="[
          'flex-col', // Default: vertical stacking for sm and md
          'lg:flex-row', // Row layout on large and xl screens
        ]"
      >
        <button
          v-for="(intro, index) in introChoices"
          :key="index"
          class="btn btn-secondary text-left whitespace-normal px-5 py-4 leading-snug break-words rounded-lg w-full lg:w-auto"
          style="min-height: 3.5rem; flex-grow: 1"
          @click.stop="setCurrentChoice(intro)"
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
import { useDisplayStore } from '@/stores/displayStore'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'

// Props
const { scenario } = defineProps({
  scenario: {
    type: Object,
    required: true,
  },
})

// Stores
const scenarioStore = useScenarioStore()
const displayStore = useDisplayStore()
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

const introChoices = computed(() => {
  try {
    return JSON.parse(scenario.intros || '[]') // Parse only when needed
  } catch {
    return [] // Fallback to an empty array in case of parsing errors
  }
})

// Methods
const deleteScenario = () => {
  if (scenario) scenarioStore.deleteScenario(scenario.id)
  displayStore.displayMode = 'scenario'
  displayStore.displayAction = 'gallery'
}
const editScenario = () => {
  scenarioStore.scenarioForm = { ...scenario }
  displayStore.displayMode = 'scenario'
  displayStore.displayAction = 'edit'
}
const cloneScenario = () => {
  scenarioStore.scenarioForm = { ...scenario }
  displayStore.displayMode = 'scenario'
  displayStore.displayAction = 'add'
}
const setCurrentChoice = (choice) => {
  scenarioStore.currentChoice = choice
  displayStore.displayMode = 'scenario'
  displayStore.displayAction = 'interact'
}
const selectScenario = () => {
  scenarioStore.selectedScenario = scenario
}

// On Mounted
onMounted(async () => {
  if (scenario.artImageId) {
    try {
      artImage.value = await artStore.getArtImageById(scenario.artImageId)
    } catch (error) {
      console.error('Failed to load art image:', error)
    }
  }
})
</script>
