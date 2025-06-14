<!-- /components/content/story/art-lab.vue -->
<template>
  <div
    class="button-container flex flex-col items-center overflow-hidden"
    :style="mainContentStyle"
  >
    <!-- Section Buttons -->
    <div
      class="flex justify-center flex-wrap gap-2 md:gap-3 lg:gap-4 w-full mb-3"
    >
      <button
        v-for="tab in tabs"
        :key="tab.name"
        class="flex-1 min-w-[45%] max-w-[30%] md:min-w-[25%] lg:min-w-[15%] px-3 py-2 text-sm md:text-md lg:text-lg font-semibold border border-accent rounded-lg transition-all duration-300 text-center"
        :class="[
          tab.name === choice
            ? 'bg-primary text-black'
            : 'bg-secondary hover:bg-accent text-black',
        ]"
        @click="selectTab(tab.name)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Components Section -->
    <div class="flex-grow w-full overflow-y-auto h-full">
      <lazy-add-art v-if="choice === 'art-maker'" />
      <lazy-art-collection v-if="choice === 'art-collection'" />
      <lazy-art-gallery v-if="choice === 'art-gallery'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDisplayStore } from '~/stores/displayStore'

// Access the display store
const displayStore = useDisplayStore()

// Tabs setup for Art Chooser
const tabs = [
  { name: 'add-art', label: 'Art Maker' },
  { name: 'art-collection', label: 'Art Collection' },
  { name: 'art-gallery', label: 'Art Gallery' },
]

// State to manage the active tab
const choice = ref(tabs[0]?.name || 'art-maker')

// Dynamically compute the main content area size
const mainContentStyle = computed(() => ({
  height: displayStore.mainContentHeight,
  width: displayStore.mainContentWidth,
}))

// Set active tab
const selectTab = (tabName: string) => {
  choice.value = tabName
}

// Ensure displayStore initializes and stays updated
onMounted(() => {
  displayStore.initialize()
})
</script>

<style></style>
