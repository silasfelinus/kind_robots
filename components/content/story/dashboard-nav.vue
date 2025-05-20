<!-- /components/content/story/dashboard-nav.vue -->
<template>
  <div class="w-full flex flex-col items-center">
    <div
      class="flex justify-center flex-wrap gap-2 md:gap-3 lg:gap-4 w-full mb-3"
    >
      <button
        v-for="tab in tabs"
        :key="tab.name"
        class="min-w-[45%] md:min-w-[33%] lg:min-w-[20%] px-4 py-2 text-sm md:text-md lg:text-lg font-semibold border border-accent rounded-lg whitespace-normal text-center"
        :class="[
          tab.name === selected
            ? 'bg-primary text-black'
            : 'bg-secondary hover:bg-accent text-black',
        ]"
        @click="selectTab(tab.name)"
      >
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplayStore } from '~/stores/displayStore'

const route = useRoute()
const displayStore = useDisplayStore()

const tabs = [
  { name: 'user-dashboard', label: 'User Dashboard' },
  { name: 'navigation-trimmed', label: 'Site Navigation' },
  { name: 'user-gallery', label: 'User Gallery' },
  { name: 'jellybean-counter', label: 'Jellybean Counter' },
  { name: 'user-chat', label: 'User Chat' },
]

const selected = ref('')

const selectTab = (tabName: string) => {
  selected.value = tabName
  displayStore.setMainComponent(tabName)
}

// Always reset to default tab on fresh navigation
watch(
  () => route.fullPath,
  () => {
    const defaultTab = tabs[0]?.name || ''
    if (defaultTab) selectTab(defaultTab)
  },
  { immediate: true },
)
</script>
