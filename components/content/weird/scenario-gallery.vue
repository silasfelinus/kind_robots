<template>
  <div class="h-full w-full bg-base-300 p-1 md:p-4 flex flex-col overflow-hidden">
    <!-- Filter and Search -->
    <div class="mb-4 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
      <!-- User Filter -->
      <div class="flex items-center">
        <label class="mr-2 text-sm font-bold text-gray-600">Filter by User:</label>
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
          aria-label="Search scenarios by title"
          placeholder="Search scenarios by title..."
          class="bg-base-200 border border-gray-400 rounded-lg p-2 w-full"
        />
      </div>
    </div>

    <!-- Scenario Grid -->
    <div class="flex-grow overflow-y-auto">
      <div v-if="isLoading" class="flex justify-center items-center h-full">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
      <div
        v-else-if="errorMessage"
        class="flex justify-center items-center h-full text-center"
      >
        <p class="text-lg font-bold text-red-600">{{ errorMessage }}</p>
      </div>
      <div
        v-else-if="filteredScenarios.length === 0"
        class="flex justify-center items-center h-full"
      >
        <p class="text-lg font-bold text-gray-600">No scenarios found.</p>
      </div>
      <div v-else class="grid grid-cols-1 gap-6 p-4">
        <ScenarioCard
          v-for="scenario in filteredScenarios"
          :key="scenario.id"
          :scenario="scenario"
          :is-selected="scenarioStore.selectedScenario?.id === scenario.id"
          @click="selectScenario(scenario.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useUserStore } from '@/stores/userStore'

// Stores
const scenarioStore = useScenarioStore()
const userStore = useUserStore()

// State
const selectedUser = ref('all')
const searchQuery = ref('')
const isLoading = ref(true)
const errorMessage = ref('')

// Fetch Scenarios on Mount
onMounted(async () => {
  try {
    isLoading.value = true
    await scenarioStore.fetchScenarios()
    isLoading.value = false
  } catch (error) {
    console.error('Failed to load scenarios:', error)
    errorMessage.value = 'Failed to load scenarios. Please try again.'
    isLoading.value = false
  }
})

// Computed: Filtered and searched scenarios
const filteredScenarios = computed(() => {
  try {
    let scenarios = scenarioStore.scenarios

    // Filter by user
    if (selectedUser.value !== 'all') {
      scenarios = scenarios.filter(
        (scenario) => scenario.userId === Number(selectedUser.value),
      )
    }

    // Search by title
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.trim().toLowerCase()
      scenarios = scenarios.filter((scenario) =>
        scenario.title.toLowerCase().includes(query),
      )
    }

    return scenarios
  } catch (error) {
    console.error('Error filtering scenarios:', error)
    return []
  }
})

// Watch Computed Results
watch(
  () => filteredScenarios.value,
  (newFilteredScenarios) => {
    console.log('Filtered scenarios:', newFilteredScenarios)
  }
)

// Methods
function selectScenario(id) {
  try {
    scenarioStore.selectScenario(id)
  } catch (error) {
    console.error('Error selecting scenario:', error)
    errorMessage.value = 'Failed to select scenario. Please try again.'
  }
}
</script>
