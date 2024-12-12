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
      title="Delete Scenario"
      @click.stop="deleteScenario"
    >
      <Icon name="mdi:delete-outline" class="w-4 h-4" />
    </button>

    <!-- Scenario Image -->
    <div class="relative flex justify-center items-center overflow-hidden rounded-lg">
      <img
        :src="computedScenarioImage"
        alt="Scenario Image"
        class="rounded-2xl w-full h-40 object-cover transition-transform hover:scale-105"
        loading="lazy"
      />
    </div>

    <!-- Scenario Details -->
    <div class="flex flex-col mt-4">
      <h2 class="text-xl font-bold text-gray-800 truncate">
        {{ scenario.title || 'Untitled Scenario' }}
      </h2>
      <p class="text-sm text-gray-600">
        {{ scenario.description || 'No description available.' }}
      </p>
    </div>

    <!-- Show Raw Scenario Object -->
    <div class="mt-4">
      <button class="btn btn-accent w-full" @click="toggleRawDetails">
        {{ showRawDetails ? 'Hide Raw Scenario Object' : 'Show Raw Scenario Object' }}
      </button>
      <pre
        v-if="showRawDetails"
        class="bg-base-100 rounded-lg p-2 mt-2 text-sm overflow-x-auto"
      >
        {{ scenario }}
      </pre>
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
const showRawDetails = ref(false);

// Computed properties
const canDelete = computed(() => userStore.isAdmin || userStore.userId === scenario.userId);
const isSelected = computed(() => scenarioStore.selectedScenario?.id === scenario.id);
const computedScenarioImage = computed(() => {
  if (artImage.value) {
    return `data:image/${artImage.value.fileType};base64,${artImage.value.imageData}`;
  }
  if (scenario.imagePath) {
    return scenario.imagePath;
  }
  return '/images/scenario-placeholder.webp';
});

// Methods
const toggleRawDetails = () => {
  showRawDetails.value = !showRawDetails.value;
};
const deleteScenario = () => scenarioStore.deleteScenario(scenario.id);

// On Mounted
onMounted(async () => {
  if (scenario.artImageId) {
    artImage.value = await artStore.getArtImageById(scenario.artImageId);
  }
});
</script>
