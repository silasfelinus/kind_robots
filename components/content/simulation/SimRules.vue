<template>
  <div class="bg-base-200 p-4 rounded-2xl">
    <h1 class="text-lg border-b mb-4">{{ title }}</h1>
    <p class="mb-4">{{ rulesDescription }}</p>

    <div class="flex flex-row flex-wrap gap-4 mb-4">
      <div
        v-for="element in elements"
        :key="element.title"
        class="flex flex-col bg-secondary p-4 rounded-2xl border w-60"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <icon
              :name="element.toggleIcon"
              class="mr-2 cursor-pointer"
              @click="toggleElement(element.title)"
            />
            <h2 class="text-lg">{{ element.title }}</h2>
          </div>
          <div class="bg-primary p-2 rounded-full flex items-center">
            <icon :name="element.spawnIcon" class="mr-2" />
            <span class="text-lg">{{ element.spawn }}</span>
          </div>
        </div>

        <div class="mt-2">
          <!-- Display the toggles and settings for the element -->
          <div class="flex flex-col space-y-2">
            <label
              v-for="(value, key) in filteredProperties(element)"
              :key="key"
              class="flex justify-between items-center"
            >
              <span class="text-lg">{{ key }}</span>
              <input
                v-if="key !== 'aggression'"
                v-model.number="element[key]"
                type="number"
                min="0"
                max="10"
                class="bg-info rounded-2xl p-2 w-16 text-center"
              />
              <input
                v-else
                v-model.number="element[key]"
                type="range"
                min="1"
                max="10"
                class="w-24"
              />
            </label>
          </div>
        </div>
      </div>
    </div>

    <button
      class="bg-primary text-lg p-2 rounded-2xl mt-4 w-full text-center"
      @click="generateSpace"
    >
      Generate Space
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSimulationStore } from '@/stores/simulationStore'

const simulationStore = useSimulationStore()
const elements = simulationStore.elements
const title = ref('Epic Paper Rock Scissors Lizard Spock Simulator')
const rulesDescription = ref(
  'Adjust the settings for each element and generate a simulation space to start the game.'
)
const activeElement = ref(null)

const toggleElement = (elementTitle) => {
  activeElement.value =
    activeElement.value && activeElement.value.title === elementTitle
      ? null
      : elements.find((e) => e.title === elementTitle)
}

const filteredProperties = (element) => {
  const excludeKeys = ['title', 'gameIcon', 'strengths', 'weaknesses', 'spawnIcon', 'toggleIcon']
  return Object.keys(element).reduce((acc, key) => {
    if (!excludeKeys.includes(key)) {
      acc[key] = element[key]
    }
    return acc
  }, {})
}

const generateSpace = () => {
  simulationStore.initializeGame({ x: 30, y: 30 })
}

onMounted(() => {
  simulationStore.loadFromLocalStorage()
})

const updateLocalStorage = (element, key, value) => {
  element[key] = value
  simulationStore.saveToLocalStorage()
}
</script>

<style scoped>
.icon {
  width: 48px;
  height: 48px;
}
</style>
