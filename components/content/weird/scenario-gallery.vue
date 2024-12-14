<template>
  <div class="h-screen w-full bg-base-300 p-4 flex flex-col overflow-y-auto">
    <h1 class="text-3xl font-bold text-gray-700 mb-4">Scenario Gallery</h1>

    <!-- Filter and Search -->
    <div class="mb-4 flex flex-wrap items-center justify-between gap-4">
      <!-- User Filter -->
      <div class="flex items-center">
        <label class="mr-2 text-sm font-bold text-gray-600"
          >Filter by User:</label
        >
        <select
          v-model="selectedUser"
          class="bg-base-200 border border-gray-400 rounded-lg p-2"
        >
          <option value="all">All Users</option>
          <option
            v-for="user in userStore.users"
            :key="user.id"
            :value="user.id"
          >
            {{ user.username }}
          </option>
        </select>
      </div>

      <!-- Search Bar -->
      <div class="flex items-center w-full md:w-1/2">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search scenarios by title..."
          class="bg-base-200 border border-gray-400 rounded-lg p-2 w-full"
        />
      </div>
    </div>

    <!-- Scenario Grid -->
    <div v-if="isLoading" class="flex justify-center items-center h-96">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
    <div
      v-else-if="errorMessage"
      class="flex justify-center items-center h-96 text-center"
    >
      <p class="text-lg font-bold text-red-600">{{ errorMessage }}</p>
    </div>
    <div
      v-else-if="filteredScenarios.length === 0"
      class="flex justify-center items-center h-96"
    >
      <p class="text-lg font-bold text-gray-600">No scenarios found.</p>
    </div>
    <div v-else class="grid grid-cols-1 gap-6">
      <ScenarioCard
        v-for="scenario in filteredScenarios"
        :key="scenario.id"
        :scenario="scenario"
        :is-selected="scenarioStore.selectedScenario?.id === scenario.id"
        @click="selectScenario(scenario.id)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useScenarioStore } from '@/stores/scenarioStore';
import { useUserStore } from '@/stores/userStore';

// Stores
const scenarioStore = useScenarioStore();
const userStore = useUserStore();

// State
const selectedUser = ref('all');
const searchQuery = ref('');
const isLoading = ref(true);
const errorMessage = ref('');

// Lifecycle: Load Scenarios
onMounted(async () => {
  try {
    console.log('Loading scenarios...');
    if (!scenarioStore.scenarios.length) {
      await scenarioStore.loadScenarios();
    }
    console.log('Scenarios loaded:', scenarioStore.scenarios);
  } catch (error) {
    errorMessage.value = 'Failed to load scenarios. Please try again later.';
    console.error('Error loading scenarios:', error);
  } finally {
    isLoading.value = false;
  }
});

// Computed: Filtered and searched scenarios
const filteredScenarios = computed(() => {
  try {
    let scenarios = scenarioStore.scenarios;

    // Filter by user
    if (selectedUser.value !== 'all') {
      scenarios = scenarios.filter(
        (scenario) => scenario.userId === Number(selectedUser.value)
      );
    }

    // Search by title
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.trim().toLowerCase();
      scenarios = scenarios.filter((scenario) =>
        scenario.title.toLowerCase().includes(query)
      );
    }

    console.log('Filtered scenarios:', scenarios);
    return scenarios;
  } catch (error) {
    console.error('Error filtering scenarios:', error);
    errorMessage.value = 'An error occurred while filtering scenarios.';
    return [];
  }
});

// Methods
function selectScenario(id) {
  try {
    console.log('Selecting scenario:', id);
    scenarioStore.selectScenario(id);
  } catch (error) {
    console.error('Error selecting scenario:', error);
    errorMessage.value = 'Failed to select scenario. Please try again.';
  }
}
</script>
