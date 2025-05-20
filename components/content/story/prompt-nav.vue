<!-- /components/content/story/prompt-nav.vue -->

<template>
  <div class="w-full flex flex-col items-center">
    <button
      class="toggle-button px-4 py-2 mb-3 bg-accent rounded-lg"
      @click="toggleVisibility"
    >
      {{ areButtonsVisible ? 'Hide Sections' : 'Show Sections' }}
    </button>

    <transition name="slide-up">
      <div
        v-if="areButtonsVisible"
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDisplayStore } from '~/stores/displayStore'

const displayStore = useDisplayStore()

const tabs = [
  { name: 'LazyBrainstormView', label: 'Brainstorm2' },
  { name: 'LazyPitchDisplay', label: 'Pitch Display' },
  { name: 'LazyAddPitch', label: 'Add Pitch' },
  { name: 'LazyBrainstormGame', label: 'Brainstorm!' },
]

const activeTab = ref(tabs[0].name)
const areButtonsVisible = ref(true)

const toggleVisibility = () => {
  areButtonsVisible.value = !areButtonsVisible.value
}

const selectTab = (tabName: string) => {
  activeTab.value = tabName
  displayStore.setMainComponent(tabName)
  areButtonsVisible.value = false
}
</script>
