<template>
  <div
    class="prompt-factory-container flex flex-col items-center overflow-hidden p-4"
    :style="mainContentStyle"
  >
    <!-- Tabs for toggling components -->
    <div
      class="flex justify-center flex-wrap gap-2 md:gap-3 lg:gap-4 w-full mb-3"
    >
      <button
        v-for="tab in tabs"
        :key="tab.name"
        class="flex-1 min-w-[45%] max-w-[30%] md:min-w-[25%] lg:min-w-[15%] px-3 py-2 text-sm md:text-md lg:text-lg font-semibold border border-accent rounded-lg transition-all duration-300 text-center"
        :class="[
          tab.name === activeTab
            ? 'bg-primary text-white'
            : 'bg-secondary hover:bg-accent text-white',
        ]"
        @click="activeTab = tab.name"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Components section with scrollable content -->
    <div class="flex-grow w-full overflow-y-auto h-full">
      <LazyPitchDisplay v-if="activeTab === 'pitch-display'" />
      <LazyAddPitch v-if="activeTab === 'add-pitch'" />
      <LazyBrainstormGame v-if="activeTab === 'brainstorm-game'" />
      <LazyBrainstormView v-if="activeTab === 'brainstorm-view'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDisplayStore } from '~/stores/displayStore'

// Access the display store
const displayStore = useDisplayStore()

// Ensure displayStore initializes and stays updated
onMounted(() => {
  displayStore.initialize()
})

// Tabs setup for Prompt Factory
const tabs = [
  { name: 'brainstorm-view', label: 'Brainstorm2' },
  { name: 'pitch-display', label: 'Pitch Display' },
  { name: 'add-pitch', label: 'Add Pitch' },
  { name: 'brainstorm-game', label: 'Brainstorm!' },
]

// Default to the first tab
const activeTab = ref(tabs[0]?.name || 'brainstorm-view')

// Dynamically compute the main content area size
const mainContentStyle = computed(() => ({
  height: `calc(${displayStore.mainVh}vh)`,
  width: `calc(${displayStore.mainVw}vw)`,
}))
</script>
