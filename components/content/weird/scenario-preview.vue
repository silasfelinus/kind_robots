<template>
  <div class="w-full mb-6">
    <!-- Scenario Selector -->
    <scenario-selector class="mb-4" />

    <!-- Scenario Details -->
    <div
      v-if="scenario?.value"
      class="p-4 border rounded-2xl bg-base-100 hover:shadow-lg transition-all"
    >
      <!-- Header Section -->
      <div class="flex items-center gap-4">
        <img
          :src="computedImage"
          alt="Scenario image"
          class="h-16 w-16 object-cover rounded-lg"
        />
        <div>
          <h2 class="text-lg font-bold text-gray-800">
            {{ scenario.value.title || 'Untitled Scenario' }}
          </h2>
          <p class="text-sm text-gray-500">
            Designer: {{ designerName || 'Unknown' }}
          </p>
        </div>
        <button
          class="text-sm text-error underline hover:no-underline ml-auto"
          @click="deselectScenario"
        >
          Deselect
        </button>
      </div>

      <!-- Scenario Info Section -->
      <div class="mt-4">
        <p v-if="scenario.value.genres" class="text-sm">
          <span class="font-bold">Genres:</span> {{ scenario.value.genres }}
        </p>
        <p v-if="scenario.value.inspirations" class="text-sm">
          <span class="font-bold">Inspirations:</span>
          {{ scenario.value.inspirations }}
        </p>
        <p v-if="scenario.value.description" class="text-sm mt-2">
          {{ scenario.value.description }}
        </p>
      </div>

      <!-- Debugging Details Toggle -->
      <button
        class="mt-4 text-sm text-primary underline hover:no-underline"
        @click="toggleDetails"
      >
        {{ showDetails ? 'Hide' : 'Show' }} Details
      </button>

      <!-- Full Object Details -->
      <div
        v-if="showDetails"
        class="mt-2 bg-base-200 border rounded-lg p-4 text-sm"
      >
        <h3 class="font-semibold mb-2">Debugging Info:</h3>
        <pre class="whitespace-pre-wrap text-gray-600">
          {{ JSON.stringify(scenario.value, null, 2) }}
        </pre>
      </div>
    </div>

    <!-- Fallback Message -->
    <div
      v-else
      class="text-sm text-gray-500 p-4 bg-base-100 border rounded-2xl"
    >
      No scenario selected. Please select a scenario above.
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'

// Props
const { scenario: propScenario } = defineProps({
  scenario: { type: Object, required: false, default: null },
})

const artImage = ref<{ fileType: string; imageData: string } | null>(null)

// Stores
const scenarioStore = useScenarioStore()
const userStore = useUserStore()
const artStore = useArtStore()

// Selected Scenario
const scenario = computed(() => propScenario || scenarioStore.selectedScenario)

const computedImage = computed(() =>
  artImage.value
    ? `data:image/${artImage.value.fileType};base64,${artImage.value.imageData}`
    : scenario?.value?.imagePath || '/images/scenarios/space.webp',
)

const designerName = computed(() =>
  scenario?.value?.userId
    ? userStore.getUserById(scenario.value.userId)?.name || 'Unknown'
    : 'Unknown',
)

// Debugging Details Toggle
const showDetails = ref(false)
const toggleDetails = () => (showDetails.value = !showDetails.value)

// Load Art Image Reactively
const loadArtImage = async () => {
  if (scenario?.value?.artImageId) {
    try {
      const result = await artStore.getArtImageById(scenario.value.artImageId)
      if (result) {
        artImage.value = {
          fileType: result.fileType,
          imageData: result.imageData,
        }
      }
    } catch (error) {
      console.error('Failed to load scenario image:', error)
    }
  } else {
    artImage.value = null
  }
}

// Deselect Scenario
const deselectScenario = () => {
  scenarioStore.selectedScenario = null
  scenarioStore.currentChoice = '' // Reset choice on deselect
}



</script>
