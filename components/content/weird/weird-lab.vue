<template>
  <div
    class="section-container flex flex-col items-center overflow-hidden"
    :style="mainContentStyle"
  >
    <!-- Toggle Button -->
    <button
      class="toggle-button px-4 py-2 mb-3 bg-accent rounded-lg"
      @click="toggleVisibility"
    >
      {{ areSectionsVisible ? 'Hide Sections' : 'Show Sections' }}
    </button>

    <!-- Section Buttons -->
    <transition name="slide-up">
      <div
        v-if="areSectionsVisible"
        class="flex justify-center flex-wrap gap-2 md:gap-3 lg:gap-4 w-full mb-3"
      >
        <button
          v-for="tab in tabs"
          :key="tab.name"
          class="flex-1 min-w-[45%] max-w-[30%] md:min-w-[25%] lg:min-w-[15%] px-3 py-2 text-sm md:text-md lg:text-lg font-semibold border border-accent rounded-lg transition-all duration-300 text-center"
          :class="[
            tab.name === activeTab
              ? 'bg-primary text-black'
              : 'bg-secondary hover:bg-accent text-black',
          ]"
          @click="selectTab(tab.name)"
        >
          {{ tab.label }}
        </button>
      </div>
    </transition>

    <!-- Section Content -->
    <div class="flex-grow w-full overflow-y-auto h-full">
      <lazy-weirder-game v-if="activeTab === 'weirdlandia-view'" />
      <lazy-character-creator v-if="activeTab === 'character-creator'" />
      <lazy-character-gallery v-if="activeTab === 'character-gallery'" />
      <lazy-add-reward v-if="activeTab === 'add-reward'" />
      <lazy-rewards-gallery v-if="activeTab === 'reward-gallery'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDisplayStore } from '~/stores/displayStore'

// Access the display store
const displayStore = useDisplayStore()

// Tabs setup for Weirdlandia
const tabs = [
  { name: 'weirdlandia-view', label: 'Weirdlandia View' },
  { name: 'character-creator', label: 'Character Creator' },
  { name: 'character-gallery', label: 'Character Gallery' },
  { name: 'add-reward', label: 'Add Reward' },
  { name: 'reward-gallery', label: 'Reward Gallery' },
]

// State to manage the active tab
const activeTab = ref(tabs[0]?.name || 'weirdlandia-view')

// State to manage section visibility
const areSectionsVisible = ref(true)

// Toggle the visibility of the sections
const toggleVisibility = () => {
  areSectionsVisible.value = !areSectionsVisible.value
}

// Set active tab and hide sections
const selectTab = (tabName: string) => {
  activeTab.value = tabName
  areSectionsVisible.value = false
}

// Dynamically compute the main content area size
const mainContentStyle = computed(() => ({
  height: `calc(${displayStore.mainVh}vh)`,
  width: `calc(${displayStore.mainVw}vw)`,
}))

// Ensure displayStore initializes and stays updated
onMounted(() => {
  displayStore.initialize()
})
</script>

<style>
/* Slide Up Transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-in-out;
}
.slide-up-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}
.slide-up-enter-to {
  transform: translateY(0);
  opacity: 1;
}
.slide-up-leave-from {
  transform: translateY(0);
  opacity: 1;
}
.slide-up-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
