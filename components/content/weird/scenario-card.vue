<template>
  <div
    :class="[
      'relative bg-base-200 border rounded-2xl p-4 m-2 hover:shadow-lg transition-all cursor-pointer',
      isSelected ? 'border-primary bg-primary/10' : 'border-gray-400',
      'flex flex-col gap-4',
    ]"
    @click="selectScenario"
  >
    <!-- Conditional Action: Edit/Add -->
    <div v-if="displayStore.displayAction === 'edit'">
      <edit-scenario />
    </div>
    <div v-else-if="displayStore.displayAction === 'add'">
      <add-scenario />
    </div>

    <!-- Default Display -->
    <div v-else>
      <!-- Action Buttons -->
      <div v-if="isSelected" class="absolute top-2 right-2 flex items-center gap-3 z-20">
        <button
          v-if="canDelete"
          class="text-error p-3 rounded-full hover:bg-error-content transition-transform hover:scale-110"
          title="Delete Scenario"
          @click.stop="deleteScenario"
        >
          <Icon name="mdi:delete" class="w-5 h-5" />
        </button>
        <button
          v-if="canDelete"
          class="text-primary p-3 rounded-full hover:bg-primary-content transition-transform hover:scale-110"
          title="Edit Scenario"
          @click.stop="editScenario"
        >
          <Icon name="mdi:pencil" class="w-5 h-5" />
        </button>
        <button
          class="text-secondary p-3 rounded-full hover:bg-secondary-content transition-transform hover:scale-110"
          title="Clone Scenario"
          @click.stop="cloneScenario"
        >
          <Icon name="mdi:content-copy" class="w-5 h-5" />
        </button>
      </div>

      <!-- Scenario Content -->
      <div class="flex flex-col md:flex-row w-full gap-4">
        <!-- Left Column -->
        <div class="flex-shrink-0 flex flex-col items-center md:items-start md:w-1/3 gap-4">
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
          <p
            v-if="scenario.genres"
            class="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded-full text-center w-full"
          >
            {{ scenario.genres }}
          </p>
          <div
            v-if="scenario.inspirations"
            class="px-3 py-2 bg-gray-100 rounded-md w-full text-left"
          >
            <span class="font-bold text-gray-700 block mb-1">Inspirations:</span>
            <p class="text-xs text-gray-500 whitespace-pre-wrap">
              {{ scenario.inspirations }}
            </p>
          </div>
        </div>

        <!-- Right Column -->
        <div class="flex flex-col md:w-2/3">
          <h2 class="text-xl font-bold text-gray-800 whitespace-normal leading-tight">
            {{ scenario.title || 'Untitled Scenario' }}
          </h2>
          <p
            :class="[
              'mt-2',
              isSelected ? 'text-sm md:text-md lg:text-lg xl:text-xl' : 'text-sm',
            ]"
          >
            {{ scenario.description || 'No description available.' }}
          </p>
        </div>
      </div>

      <!-- Choices Section -->
      <div
        v-if="isSelected && introChoices.length"
        class="grid gap-4 mt-6 w-full"
        :class="[
          'grid-cols-1',
          'md:grid-cols-2',
          'lg:grid-cols-3',
          'xl:grid-cols-4',
        ]"
      >
        <button
          v-for="(intro, index) in introChoices"
          :key="index"
          class="btn btn-secondary text-left px-8 py-6 leading-relaxed break-words whitespace-normal rounded-lg w-full"
          style="
            height: auto;
            min-height: 4rem;
            max-height: none;
            overflow-wrap: anywhere;
            white-space: normal;
          "
          @click.stop="setCurrentChoice(intro)"
        >
          {{ intro }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'

// Props
const { scenario } = defineProps({
  scenario: { type: Object, required: true },
})

// Stores
const scenarioStore = useScenarioStore()
const displayStore = useDisplayStore()
const userStore = useUserStore()
const artStore = useArtStore()

// State
const artImage = ref(null)

// Computed
const isSelected = computed(
  () => scenarioStore.selectedScenario?.id === scenario.id
)
const canDelete = computed(
  () => userStore.isAdmin || userStore.userId === scenario.userId
)
const computedScenarioImage = computed(() =>
  artImage.value
    ? `data:image/${artImage.value.fileType};base64,${artImage.value.imageData}`
    : scenario.imagePath || '/images/scenarios/space.webp'
)
const introChoices = computed(() => {
  try {
    return JSON.parse(scenario.intros || '[]')
  } catch {
    return []
  }
})

// Methods
const selectScenario = () => {
  scenarioStore.selectedScenario = scenario
}
const deleteScenario = () => {
  scenarioStore.deleteScenario(scenario.id)
  displayStore.displayAction = 'gallery'
}
const editScenario = () => {
  scenarioStore.scenarioForm = { ...scenario }
  displayStore.displayAction = 'edit'
}
const cloneScenario = () => {
  scenarioStore.scenarioForm = {
    ...scenario,
    id: null,
    title: `Copy of ${scenario.title || 'Untitled Scenario'}`,
  }
  displayStore.displayAction = 'add'
}
const setCurrentChoice = (choice) => {
  scenarioStore.currentChoice = choice
  displayStore.displayAction = 'interact'
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
