<template>
  <div
    :class="[
      'relative bg-base-200 border rounded-2xl p-4 m-2 hover:shadow-lg transition-all cursor-pointer',
      isSelected ? 'border-primary bg-primary/10' : 'border-gray-400',
      'flex flex-col md:flex-row items-start gap-4',
    ]"
    @click="selectScenario"
  >
    <!-- Delete Button -->
    <button
      v-if="canDelete"
      class="absolute top-2 right-2 bg-error text-white p-2 rounded-full hover:bg-error-content transition-transform hover:scale-110 z-20"
      title="Delete Scenario"
      @click.stop="deleteScenario"
    >
      <Icon name="mdi:delete" class="w-4 h-4" />
    </button>

    <!-- Scenario Image and Genres -->
    <div class="flex-shrink-0 relative flex flex-col items-center md:w-1/3">
      <img
        :src="computedScenarioImage"
        alt="Scenario Image"
        class="rounded-2xl w-full h-40 object-cover transition-transform hover:scale-105"
        loading="lazy"
      />
      <!-- Genres -->
      <p
        v-if="scenario.genres"
        class="mt-2 text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded-full text-center w-full truncate"
      >
        {{ scenario.genres }}
      </p>
    </div>

    <!-- Scenario Details -->
    <div class="flex flex-col md:w-2/3">
      <!-- Title and Description -->
      <h2 class="text-xl font-bold text-gray-800 truncate">
        {{ scenario.title || 'Untitled Scenario' }}
      </h2>
      <p class="text-sm text-gray-600">
        {{ scenario.description || 'No description available.' }}
      </p>

      <!-- Intros -->
      <div
        v-if="isSelected"
        class="flex flex-col gap-2 mt-4"
      >
        <button
          v-for="(intro, index) in introChoices"
          :key="index"
          class="btn btn-secondary btn-sm text-left whitespace-normal"
          @click.stop="setCurrentChoice(intro)"
        >
          {{ intro }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useScenarioStore } from '@/stores/scenarioStore';
import { useUserStore } from '@/stores/userStore';
import { useArtStore } from '@/stores/artStore';

// Props
const { scenario } = defineProps({
  scenario: {
    type: Object,
    required: true,
  },
});

// Stores
const scenarioStore = useScenarioStore();
const userStore = useUserStore();
const artStore = useArtStore();

// State
const artImage = ref(null);

// Computed properties
const canDelete = computed(
  () => userStore.isAdmin || userStore.userId === scenario.userId,
);
const isSelected = computed(
  () => scenarioStore.selectedScenario?.id === scenario.id,
);
const computedScenarioImage = computed(() => {
  if (artImage.value) {
    return `data:image/${artImage.value.fileType};base64,${artImage.value.imageData}`;
  }
  if (scenario.imagePath) {
    return scenario.imagePath;
  }
  return '/images/scenarios/space.webp';
});

// Intros
const introChoices = computed(() => {
  try {
    return JSON.parse(scenario.intros) || [];
  } catch {
    console.error('Failed to parse intros:', scenario.intros);
    return [];
  }
});

// Methods
const deleteScenario = () => {
  if (scenario) scenarioStore.deleteScenario(scenario.id);
};
const setCurrentChoice = (choice) => {
  scenarioStore.currentChoice = choice;
};
const selectScenario = () => {
  scenarioStore.selectedScenario = scenario;
};

// On Mounted
onMounted(async () => {
  console.log('Loading scenario:', scenario);

  if (scenario.artImageId) {
    try {
      artImage.value = await artStore.getArtImageById(scenario.artImageId);
      console.log('Art image loaded:', artImage.value);
    } catch (error) {
      console.error('Failed to load art image:', error);
    }
  }
});
</script>
